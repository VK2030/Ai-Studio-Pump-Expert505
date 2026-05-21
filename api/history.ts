import { supabase } from "./_lib/supabase.js";

console.log("[API] history.ts loaded");

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      if (!supabase) {
        console.warn("Supabase client is null. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        return res.json([]);
      }
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Supabase error fetching history:", JSON.stringify(error));
        return res.status(500).json({ 
          error: "Supabase Error", 
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }
      res.json(data || []);
    } catch (error: any) {
      console.error("Internal Server Error in /api/history:", error);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message || String(error)
      });
    }
  } else if (req.method === 'POST') {
    try {
      const entry = req.body;
      console.log(`[API] Attempting to save result for user: ${entry.user || "Contestant"}`);
      
      if (!supabase) {
        console.error("[API] Supabase client is not initialized. Check environment variables.");
        return res.status(500).json({ error: "Supabase not initialized", hint: "Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" });
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

      if (error) {
        console.error("[API] Supabase insert error:", JSON.stringify(error));
        throw error;
      }

      console.log("[API] Successfully saved result to Supabase");
      res.json(data);
    } catch (error: any) {
      console.error("[API] POST /api/history exception:", error);
      res.status(500).json({ 
        error: error.message || "Internal Server Error",
        details: error.details || null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const adminPassword = req.headers['x-admin-password'];
      if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });

      const { data: authData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_password")
        .single();
      
      const correctPassword = authData?.value || '2026';
      if (adminPassword !== correctPassword) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      console.log("[API] Clearing results table...");
      // Fix: Supabase JS v2 delete syntax
      const { count, error } = await supabase
        .from("results")
        .delete()
        .neq('id', -1);
      
      if (error) throw error;

      console.log("[API] Clearing question_views table...");
      const { error: viewsError } = await supabase
        .from("question_views")
        .delete()
        .neq('id', -1);

      res.json({ success: true, deletedCount: count, viewsCleared: !viewsError });
    } catch (error: any) {
      console.error("[API] DELETE /api/history exception:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
