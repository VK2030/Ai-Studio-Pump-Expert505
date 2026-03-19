import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// API: Проверка статуса
app.get("/api/debug/supabase", (req, res) => {
  res.json({
    status: "ok",
    configured: !!(supabaseUrl && supabaseServiceKey),
    initialized: !!supabase,
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

// API: Вход (Безопасная проверка пароля на сервере)
app.post("/api/login", async (req, res) => {
  try {
    const { role, password } = req.body;
    
    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    // Имитация задержки для предотвращения быстрого перебора (brute force)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Если Supabase не настроен, используем временные дефолтные пароли (для отладки)
    // В продакшене это должно быть строго в базе
    const defaultPasswords: Record<string, string> = {
      contestant: '7777',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];

    if (supabase) {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", `${role}_password`)
        .single();
      
      if (!error && data) {
        correctPassword = data.value;
      }
    }

    if (password === correctPassword) {
      // В идеале здесь нужно генерировать JWT токен
      // Для текущей архитектуры возвращаем успех и роль
      res.json({ success: true, role });
    } else {
      res.status(401).json({ success: false, error: "Invalid password" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
