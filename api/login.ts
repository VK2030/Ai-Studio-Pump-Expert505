console.log("[API] login.ts loading...");
import { supabase } from "./_lib/supabase";
console.log("[API] login.ts: supabase imported");

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[API][${requestId}] Login attempt started`);

  try {
    const { role, password } = req.body || {};
    console.log(`[API][${requestId}] Role: ${role}, Password provided: ${!!password}`);
    
    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    const defaultPasswords: Record<string, string> = {
      contestant: '7777',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];
    console.log(`[API][${requestId}] Default password for ${role}: ${correctPassword}`);

    try {
      if (supabase) {
        console.log(`[API][${requestId}] Checking Supabase...`);
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", `${role}_password`)
          .single();
        
        if (error) {
          console.error(`[API][${requestId}] Supabase error:`, error.message);
        } else if (data?.value) {
          correctPassword = data.value;
          console.log(`[API][${requestId}] Supabase password found`);
        }
      } else {
        console.log(`[API][${requestId}] Supabase not initialized`);
      }
    } catch (e: any) {
      console.error(`[API][${requestId}] Supabase catch block:`, e.message);
    }

    if (String(password) === String(correctPassword)) {
      console.log(`[API][${requestId}] Login success`);
      return res.json({ success: true, role });
    }
    
    console.warn(`[API][${requestId}] Login failed: Invalid password`);
    return res.status(401).json({ success: false, error: "Invalid password" });
  } catch (error: any) {
    console.error(`[API][${requestId}] CRITICAL LOGIN ERROR:`, error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
