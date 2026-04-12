// import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // Simple GET for testing
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: "Login API is alive. Use POST to login.",
      version: "1.0.5" 
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[API][${requestId}] Login attempt started`);

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn(`[API][${requestId}] Failed to parse body string:`, e);
      }
    }
    
    const { role, password } = body || {};
    
    if (!role || !password) {
      return res.status(400).json({ error: "Role and password are required" });
    }

    const defaultPasswords: Record<string, string> = {
      contestant: '7777',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];

    /* Supabase disabled for debugging
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", `${role}_password`)
          .single();
        
        if (!error && data?.value) {
          correctPassword = data.value;
        }
      } catch (supabaseErr: any) {
        console.error(`[API][${requestId}] Supabase error:`, supabaseErr.message);
      }
    }
    */

    if (String(password) === String(correctPassword)) {
      return res.status(200).json({ success: true, role, version: "1.0.5" });
    }
    
    return res.status(401).json({ success: false, error: "Invalid password" });
  } catch (error: any) {
    console.error(`[API][${requestId}] CRITICAL ERROR:`, error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      requestId 
    });
  }
}
