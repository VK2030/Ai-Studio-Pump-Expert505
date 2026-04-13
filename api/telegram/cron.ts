
import { supabase } from "../_lib/supabase.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Copy of MODULES from constants.tsx to avoid complex imports in serverless function
const MODULES = [
  { id: 'esp-selection-startup', title: 'Подбор ЭЦН и ВНР' },
  { id: 'failure-investigation', title: 'Расследование отказов ЭЦН' },
  { id: 'operating-factors', title: 'Осложняющие факторы' },
  { id: 'pbotos', title: 'ПБОТОС' }
];

const PBOTOS_SUBMODULES: Record<string, string> = {
  'pbotos-general': 'Общие вопросы ОТ',
  'pbotos-siz': 'СИЗ',
  'pbotos-harmful': 'Вредные и опасные ПФ',
  'pbotos-firstaid': 'Оказание первой помощи',
  'pbotos-a1': 'А1. Основы ПБ',
  'pbotos-b21': 'Б.2.1 Для объектов нефтяной промышленности',
};

const escapeHTML = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export default async function handler(req: any, res: any) {
  // Vercel Cron jobs use GET by default
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not initialized" });
    }

    // 1. Get Schedule
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("*");
    
    const settings: Record<string, any> = {};
    settingsData?.forEach((item: any) => settings[item.key] = item.value);

    const schedule = settings.telegram_schedule;
    if (!schedule || !schedule.enabled) {
      return res.json({ status: "skipped", reason: "Schedule disabled or missing" });
    }

    // 2. Check Day and Time
    // Adjust to UTC+5 (Yekaterinburg)
    const offset = 5;
    const nowUtc = new Date();
    const nowYekaterinburg = new Date(nowUtc.getTime() + offset * 60 * 60 * 1000);
    
    const currentDay = nowYekaterinburg.getUTCDay(); // 0-6
    const currentHour = nowYekaterinburg.getUTCHours();
    const currentMinute = nowYekaterinburg.getUTCMinutes();

    const [schedHour, schedMinute] = schedule.time.split(':').map(Number);

    if (!schedule.days.includes(currentDay)) {
      return res.json({ status: "skipped", reason: "Wrong day", currentDay, scheduledDays: schedule.days });
    }

    // Check if we are within the window (since cron runs every 10 mins)
    const nowInMinutes = currentHour * 60 + currentMinute;
    const schedInMinutes = schedHour * 60 + schedMinute;
    
    // Calculate difference in minutes, handling day wrap-around
    let diff = nowInMinutes - schedInMinutes;
    if (diff < -1200) diff += 1440; // Handle case where it's 00:05 and scheduled for 23:55
    
    // Allow a window of 12 minutes to ensure we catch it even if cron is slightly delayed
    // but not too wide to avoid double sends (last_sent check handles that too)
    if (diff < 0 || diff >= 12) {
      return res.json({ 
        status: "skipped", 
        reason: "Wrong time", 
        now: `${currentHour}:${currentMinute}`, 
        scheduled: schedule.time,
        diffMinutes: diff
      });
    }

    // 3. Check Last Sent to avoid duplicates in the same window
    const lastSent = settings.telegram_last_sent; // ISO string
    if (lastSent) {
      const lastDate = new Date(lastSent);
      const timeDiff = nowYekaterinburg.getTime() - lastDate.getTime();
      if (timeDiff < 15 * 60 * 1000) { // Less than 15 mins ago
        return res.json({ status: "skipped", reason: "Already sent recently" });
      }
    }

    // 4. Fetch History and Generate Report
    const { data: history } = await supabase
      .from("quiz_history")
      .select("*")
      .order("date", { ascending: false });

    if (!history || history.length === 0) {
      return res.json({ status: "skipped", reason: "No history to report" });
    }

    // Calculate stats
    const statsByModule: Record<string, any> = {};
    const moduleRecentScores: Record<string, number[]> = {};

    history.forEach((entry: any) => {
      const modId = entry.module_id || 'unknown';
      if (!statsByModule[modId]) {
        statsByModule[modId] = { count: 0, totalScore: 0, latestEntry: entry };
      }
      
      const [correct, total] = entry.score.split('/').map(Number);
      statsByModule[modId].count += 1;
      statsByModule[modId].totalScore += correct;

      if (!moduleRecentScores[modId]) moduleRecentScores[modId] = [];
      if (moduleRecentScores[modId].length < 3) {
        moduleRecentScores[modId].push(Math.round((correct / total) * 100));
      }
    });

    // Generate Summary
    const dateStr = nowYekaterinburg.toLocaleDateString('ru-RU');
    let summary = `<b>📅 Автоматический отчет (${dateStr})</b>\n\n`;
    
    for (const module of MODULES) {
      const modId = module.id;
      let section = '';
      
      if (modId === 'pbotos') {
        if (statsByModule['pbotos']) {
          const stats = statsByModule['pbotos'];
          const recent = moduleRecentScores['pbotos'] || [];
          section += `🔹 <b>ПБОТОС</b>\n`;
          if (recent.length > 0) section += `   Последние: ${recent.map(s => `${s}%`).join(', ')}\n`;
          section += `   Пройдено: ${stats.count}\n\n`;
        }

        for (const [subId, subTitle] of Object.entries(PBOTOS_SUBMODULES)) {
          if (statsByModule[subId]) {
            const stats = statsByModule[subId];
            const recent = moduleRecentScores[subId] || [];
            section += `🔹 <b>ПБОТОС/${subTitle}</b>\n`;
            if (recent.length > 0) section += `   Последние: ${recent.map(s => `${s}%`).join(', ')}\n`;
            section += `   Пройдено: ${stats.count}\n\n`;
          }
        }
      } else {
        if (statsByModule[modId]) {
          const stats = statsByModule[modId];
          const recent = moduleRecentScores[modId] || [];
          section += `🔹 <b>${module.title}</b>\n`;
          if (recent.length > 0) section += `   Последние: ${recent.map(s => `${s}%`).join(', ')}\n`;
          section += `   Пройдено: ${stats.count}\n\n`;
        }
      }

      if (summary.length + section.length > 3800) break;
      summary += section;
    }

    const timeStr = nowYekaterinburg.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    summary += `🕒 <i>Отчет сформирован автоматически (${timeStr} ЕКБ)</i>`;

    // 5. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error("Telegram config missing");
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: summary,
        parse_mode: "HTML",
      }),
    });

    if (!tgRes.ok) {
      const err = await tgRes.json();
      throw new Error(err.description || "TG send failed");
    }

    // 6. Update Last Sent
    await supabase
      .from("app_settings")
      .upsert({ key: 'telegram_last_sent', value: nowYekaterinburg.toISOString() }, { onConflict: 'key' });

    res.json({ success: true, message: "Report sent successfully" });

  } catch (error: any) {
    console.error("Cron error:", error);
    res.status(500).json({ error: error.message });
  }
}
