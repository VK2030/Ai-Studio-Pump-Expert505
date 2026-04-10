import express from "express";
import { createClient } from "@supabase/supabase-js";

console.log("[API] index.ts loading...");

const app = express();
app.use(express.json({ limit: '1mb' }));

// Простейший тест без роутера
app.get("/api/ping", (req, res) => {
  console.log("[API] Ping hit");
  res.send("pong");
});

const router = express.Router();

// Инициализация Supabase с очисткой ключей
const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl) console.warn("SUPABASE_URL is missing in environment");
if (!supabaseServiceKey) console.warn("SUPABASE_SERVICE_ROLE_KEY is missing in environment");

let supabase: any = null;
try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error("Supabase initialization failed:", error);
}

// API: Простая проверка
router.get("/test", (req, res) => {
  res.json({ message: "Server is alive" });
});

// API: Проверка статуса
router.get("/debug/supabase", (req, res) => {
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
router.get("/history", async (req, res) => {
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
router.post("/history", async (req, res) => {
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
router.delete("/history", async (req, res) => {
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

    // Также очищаем счетчики просмотров вопросов
    const { error: viewsError } = await supabase
      .from("question_views")
      .delete()
      .neq('id', -1); // В Supabase .delete() требует фильтр, если не настроено иначе

    if (viewsError) {
      console.error("Failed to clear question_views:", viewsError);
    }

    res.json({ success: true, deletedCount: count, viewsCleared: !viewsError });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Отправка в Telegram
router.post("/telegram/send-summary", async (req, res) => {
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
router.get("/config", async (req, res) => {
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
router.post("/config", async (req, res) => {
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
    if (adminPassword !== String(correctPassword)) {
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

// API: Ручная синхронизация настроек (Admin)
router.post("/admin/sync", async (req, res) => {
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
    if (adminPassword !== String(correctPassword)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Инициализация дефолтных паролей если их нет
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
        await supabase.from("app_settings").insert([setting]);
      }
    }

    res.json({ success: true, message: "Settings sync completed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Получение вопросов модуля (из локального файла questions_data.ts)
router.get("/quiz/questions/:moduleId", async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { userName } = req.query;
    
    // Динамический импорт для экономии памяти при холодном старте
    const { QUIZ_QUESTIONS } = await import("./questions_data");
    const questionsForModule = QUIZ_QUESTIONS[moduleId] || [];
    
    // Форматируем вопросы с ID
    const formattedQuestions = questionsForModule.map((q, i) => ({
      ...q,
      id: `${moduleId}_${i}`,
      viewCount: 0
    }));

    if (userName && supabase) {
      const { data: views, error: viewsError } = await supabase
        .from("question_views")
        .select("question_id, view_count")
        .eq("user_name", userName);
      
      if (!viewsError && views) {
        const viewMap = new Map(views.map(v => [v.question_id, v.view_count]));
        const enrichedQuestions = formattedQuestions.map(q => ({
          ...q,
          viewCount: viewMap.get(q.id) || 0
        }));
        return res.json(enrichedQuestions);
      }
    }

    res.json(formattedQuestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Инкремент просмотров вопросов
router.post("/quiz/views/increment", async (req, res) => {
  try {
    const { userName, questionIds } = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
    if (!userName || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    for (const qId of questionIds) {
      // Получаем текущее количество просмотров
      const { data, error: selectError } = await supabase
        .from("question_views")
        .select("view_count")
        .eq("user_name", userName)
        .eq("question_id", qId)
        .maybeSingle();
      
      const currentCount = data?.view_count || 0;
      
      await supabase
        .from("question_views")
        .upsert({
          user_name: userName,
          question_id: qId,
          view_count: currentCount + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_name,question_id' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Проверка ответов
router.post("/quiz/check", async (req, res) => {
  try {
    const { moduleId, questionIdx, selectedOptions } = req.body;
    
    // Динамический импорт
    const { QUIZ_QUESTIONS } = await import("./questions_data");
    const questionsForModule = QUIZ_QUESTIONS[moduleId] || [];
    const question = questionsForModule[questionIdx];

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const isCorrect = JSON.stringify(selectedOptions.sort()) === JSON.stringify(question.correct.sort());
    
    res.json({
      isCorrect,
      correctOptions: question.correct
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Проверка ответа (на сервере с использованием локального файла)
router.post("/quiz/check-legacy", async (req, res) => {
  try {
    const { questionId, selectedOptions } = req.body;
    
    // questionId имеет формат moduleId_index
    const parts = questionId.split('_');
    const moduleId = parts[0];
    const index = parseInt(parts[1]);

    const { QUIZ_QUESTIONS } = await import("./questions_data");
    const moduleQuestions = QUIZ_QUESTIONS[moduleId];
    
    if (!moduleQuestions || !moduleQuestions[index]) {
      return res.status(404).json({ error: "Question not found" });
    }

    const question = moduleQuestions[index];
    const correctIndices = question.correct as number[];
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
router.post("/login", async (req, res) => {
  console.log(`[API] Login attempt: ${JSON.stringify(req.body)}`);
  try {
    const { role, password } = req.body || {};
    
    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    // Временная упрощенная проверка для отладки
    const defaultPasswords: Record<string, string> = {
      contestant: '7777',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];

    // Пробуем получить из Supabase если он есть
    try {
      if (supabase) {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", `${role}_password`)
          .single();
        if (data?.value) correctPassword = data.value;
      }
    } catch (e) {
      console.warn("Supabase check failed, using default");
    }

    if (String(password) === String(correctPassword)) {
      return res.json({ success: true, role });
    }
    
    return res.status(401).json({ success: false, error: "Invalid password" });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// API: Ручная синхронизация данных (Admin) - Удалена синхронизация вопросов
router.post("/admin/sync-legacy", async (req, res) => {
  res.json({ success: true, message: "Legacy sync is disabled. Questions are now local." });
});

// Запуск авто-синхронизации (УДАЛЕНО для предотвращения таймаутов на Vercel)
// autoSyncQuestions();

// API: Статус здоровья
router.get("/health", async (req, res) => {
  try {
    const { count: settingsCount, error: sError } = supabase 
      ? await supabase.from("app_settings").select("*", { count: 'exact', head: true })
      : { count: 0, error: null };
    
    const { QUIZ_QUESTIONS } = await import("./questions_data");
    const modulesLoaded = Object.keys(QUIZ_QUESTIONS);
    const totalQuestions = modulesLoaded.reduce((acc, key) => acc + QUIZ_QUESTIONS[key].length, 0);

    res.json({ 
      status: "ok", 
      settings: { count: settingsCount, error: sError },
      questions: {
        modules: modulesLoaded,
        total: totalQuestions
      },
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      }
    });
  } catch (e: any) {
    res.json({ status: "error", message: e.message });
  }
});

app.use("/api", router);
app.use("/", router); // Fallback для разных способов проброса путей на Vercel

// Глобальный обработчик ошибок
app.use((err: any, req: any, res: any, next: any) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
