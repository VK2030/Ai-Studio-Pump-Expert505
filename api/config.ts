import { supabase } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      if (!supabase) {
        console.warn("Supabase client is null in /api/config. Returning default config.");
        return res.json({ isHistoryAnswersEnabled: true });
      }
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");
      
      if (error) {
        console.error("Supabase error fetching config:", error);
        throw error;
      }
      
      const config: Record<string, any> = {};
      data.forEach((item: any) => {
        if (!item.key.endsWith('_password')) {
          config[item.key] = item.value;
        }
      });
      
      res.json(config);
    } catch (error: any) {
      console.error("Internal Server Error in /api/config:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value } = req.body;
      const adminPassword = req.headers['x-admin-password'];
      if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
      
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
