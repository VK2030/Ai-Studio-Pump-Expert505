import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Supabase Client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase environment variables are missing!");
    console.log("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  if (supabase) {
    console.log("✅ Supabase Client initialized successfully");
  }

  app.use(express.json());

  // API: Debug Supabase connection
  app.get("/api/debug/supabase", (req, res) => {
    res.json({
      configured: !!(supabaseUrl && supabaseServiceKey),
      url: supabaseUrl || "MISSING",
      hasServiceKey: !!supabaseServiceKey,
      initialized: !!supabase
    });
  });

  // API: Get history from Supabase
  app.get("/api/history", async (req, res) => {
    try {
      if (!supabase) {
        console.warn("⚠️ Supabase not initialized, returning empty history");
        return res.json([]);
      }
      
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      res.json(data || []);
    } catch (error: any) {
      console.error("Error fetching history:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Save history entry to Supabase
  app.post("/api/history", async (req, res) => {
    try {
      const entry = req.body;
      console.log("📥 Сохранение в Supabase (таблица results):", entry.user || entry.moduleId);

      if (!supabase) {
        return res.status(500).json({ error: "Supabase not initialized. Check environment variables." });
      }

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

      console.log("✅ Успешно сохранено! ID записи:", data.id);
      res.json(data);
    } catch (error: any) {
      console.error("❌ Ошибка при сохранении в Supabase:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Delete all history from Supabase (Admin only)
  app.delete("/api/history", async (req, res) => {
    try {
      console.log("🗑️ Запрос на полную очистку базы данных...");
      if (!supabase) {
        return res.status(500).json({ error: "Supabase not initialized" });
      }

      const { count, error } = await supabase
        .from("results")
        .delete({ count: 'exact' })
        .neq('id', -1);

      if (error) throw error;
      
      console.log(`✅ База очищена. Удалено записей: ${count}`);
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      console.error("❌ Ошибка при очистке Supabase:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
