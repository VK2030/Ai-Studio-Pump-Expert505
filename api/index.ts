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
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
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

export default app;
