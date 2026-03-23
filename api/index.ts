import express from "express";
import { createClient } from "@supabase/supabase-js";
import { QUIZ_QUESTIONS } from "./constants_data.js";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Инициализация Supabase с очисткой ключей
const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl) console.warn("SUPABASE_URL is missing in environment");
if (!supabaseServiceKey) console.warn("SUPABASE_SERVICE_ROLE_KEY is missing in environment");

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// API: Простая проверка
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is alive" });
});

// API: Проверка статуса
app.get("/api/debug/supabase", (req, res) => {
  res.json({
    status: "ok",
    configured: !!(supabaseUrl && supabaseServiceKey),
    initialized: !!supabase,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    env: process.env.NODE_ENV || "development"
  });
});

// API: Получение истории
app.get("/api/history", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Сохранение результата
app.post("/api/history", async (req, res) => {
  try {
    const entry = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
    const { data, error } = await supabase
      .from("results")
      .insert([{
        user: entry.user || "Contestant",
        score: entry.score,
        correct_answers: entry.correct_answers || parseInt(entry.score?.split('/')[0] || '0'),
        moduleId: entry.moduleId || "unknown",
        session: entry.session || 0,
        incorrectAnswers: entry.incorrectAnswers || [],
        date: entry.date || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Очистка (Admin)
app.delete("/api/history", async (req, res) => {
  try {
    const adminPassword = req.headers['x-admin-password'];
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });

    // Проверка пароля админа
    const { data: authData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();
    
    const correctPassword = authData?.value || '2026';
    if (adminPassword !== correctPassword) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { count, error } = await supabase
      .from("results")
      .delete({ count: 'exact' })
      .neq('id', -1);
    if (error) throw error;
    res.json({ success: true, deletedCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Отправка в Telegram
app.post("/api/telegram/send-summary", async (req, res) => {
  try {
    const { summary } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: "Telegram configuration is missing" });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: summary,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.description || "Failed to send message to Telegram");
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Telegram error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Получение глобальных настроек
app.get("/api/config", async (req, res) => {
  try {
    if (!supabase) return res.json({ isHistoryAnswersEnabled: true });
    const { data, error } = await supabase
      .from("app_settings")
      .select("*");
    
    if (error) throw error;
    
    const config: Record<string, any> = {};
    data.forEach(item => {
      // Не отправляем пароли на фронтенд
      if (!item.key.endsWith('_password')) {
        config[item.key] = item.value;
      }
    });
    
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Обновление глобальных настроек (Admin)
app.post("/api/config", async (req, res) => {
  try {
    const { key, value } = req.body;
    const adminPassword = req.headers['x-admin-password'];
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
    
    // Проверка пароля админа
    const { data: authData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();
    
    const correctPassword = authData?.value || '2026';
    if (adminPassword !== correctPassword) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: 'key' });
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Получение вопросов модуля (без правильных ответов)
app.get("/api/quiz/questions/:moduleId", async (req, res) => {
  try {
    const { moduleId } = req.params;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });

    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, text, options")
      .eq("module_id", moduleId)
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Проверка ответа (на сервере)
app.post("/api/quiz/check", async (req, res) => {
  try {
    const { questionId, selectedOptions } = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });

    const { data, error } = await supabase
      .from("quiz_questions")
      .select("correct")
      .eq("id", questionId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Question not found" });

    const correctIndices = data.correct as number[];
    const isCorrect = 
      selectedOptions.length === correctIndices.length &&
      selectedOptions.every((opt: number) => correctIndices.includes(opt));

    res.json({ 
      isCorrect, 
      correctIndices: correctIndices
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Вход (Безопасная проверка пароля на сервере)
app.post("/api/login", async (req, res) => {
  try {
    const { role, password } = req.body;
    console.log(`Login attempt: role=${role}, password=${password}`);
    
    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    // Имитация задержки для предотвращения быстрого перебора (brute force)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Если Supabase не настроен, используем временные дефолтные пароли (для отладки)
    const defaultPasswords: Record<string, string> = {
      contestant: '7777',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];
    console.log(`Default password for ${role}: ${correctPassword}`);

    if (supabase) {
      console.log(`Checking Supabase for ${role}_password...`);
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", `${role}_password`)
        .single();
      
      if (error) {
        console.error(`Supabase error fetching ${role}_password:`, error.message);
      } else if (data) {
        correctPassword = data.value;
        console.log(`Supabase password found for ${role}: ${correctPassword}`);
      } else {
        console.log(`No custom password found in Supabase for ${role}, using default.`);
      }
    } else {
      console.warn("Supabase not initialized, using default passwords.");
    }

    if (password === String(correctPassword)) {
      console.log(`Login successful for ${role}`);
      res.json({ success: true, role });
    } else {
      console.warn(`Login failed for ${role}: expected ${correctPassword}, got ${password}`);
      // Возвращаем более детальную ошибку для отладки (временно)
      res.status(401).json({ 
        success: false, 
        error: "Invalid password",
        debug: {
          supabaseInitialized: !!supabase,
          roleRequested: role,
          usingDefault: correctPassword === defaultPasswords[role]
        }
      });
    }
  } catch (error: any) {
    console.error("Login endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Автоматическая синхронизация при запуске сервера
const autoSyncQuestions = async () => {
  if (!supabase) {
    console.warn("Auto-sync skipped: Supabase not initialized");
    return;
  }

  console.log("🚀 Starting auto-sync of questions and settings...");
  try {
    // 1. Синхронизация вопросов
    const rows: any[] = [];
    for (const moduleId in QUIZ_QUESTIONS) {
      QUIZ_QUESTIONS[moduleId].forEach((q: any, index: number) => {
        rows.push({
          id: `${moduleId}_${index}`,
          module_id: moduleId,
          text: q.text,
          options: q.options,
          correct: q.correct
        });
      });
    }

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .upsert(rows, { onConflict: 'id' });

    if (questionsError) throw questionsError;
    console.log(`✅ Auto-sync completed: ${rows.length} questions updated.`);

    // 2. Инициализация дефолтных паролей, если их нет
    const defaultSettings = [
      { key: 'admin_password', value: '2026' },
      { key: 'contestant_password', value: '7777' }
    ];

    for (const setting of defaultSettings) {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", setting.key)
        .single();
      
      if (!data) {
        console.log(`Setting default ${setting.key}...`);
        await supabase
          .from("app_settings")
          .insert([setting]);
      }
    }
    console.log("✅ Settings initialization checked.");
  } catch (error) {
    console.error("❌ Auto-sync failed:", error);
  }
};

// Запуск авто-синхронизации (отключено для отладки на Vercel)
// autoSyncQuestions();

export default app;
