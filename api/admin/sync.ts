import { supabase } from "../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
}
