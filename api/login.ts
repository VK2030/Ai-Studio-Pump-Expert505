export default async function handler(req: any, res: any) {
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

    // Initialize Supabase inside the handler to catch errors
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", `${role}_password`)
          .single();
        
        if (!error && data?.value) {
          correctPassword = data.value;
          console.log(`[API][${requestId}] Password fetched from Supabase`);
        } else if (error) {
          console.warn(`[API][${requestId}] Supabase query error (using default):`, error.message);
        }
      } catch (supabaseErr: any) {
        console.error(`[API][${requestId}] Supabase init/query crash:`, supabaseErr.message);
      }
    } else {
      console.log(`[API][${requestId}] Supabase env vars missing, using default passwords`);
    }

    if (String(password) === String(correctPassword)) {
      console.log(`[API][${requestId}] Login success for role: ${role}`);
      return res.status(200).json({ success: true, role });
    }
    
    console.warn(`[API][${requestId}] Login failed: Invalid password for role: ${role}`);
    return res.status(401).json({ success: false, error: "Invalid password" });
  } catch (error: any) {
    console.error(`[API][${requestId}] CRITICAL LOGIN ERROR:`, error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      requestId 
    });
  }
}
