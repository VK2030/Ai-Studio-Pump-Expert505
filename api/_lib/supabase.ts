import { createClient } from "@supabase/supabase-js";

console.log("[API] supabase.ts initializing");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let supabase: any = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    // Ensure URL is valid and handle trailing slashes which sometimes cause issues with some client versions
    const normalizedUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
    
    if (!normalizedUrl.startsWith('http')) {
      console.error("[API] Invalid SUPABASE_URL format. Must start with http:// or https://");
    } else {
      console.log(`[API] Initializing Supabase client with URL: ${normalizedUrl.substring(0, 20)}...`);
      supabase = createClient(normalizedUrl, supabaseServiceKey);
    }
  } else {
    console.warn("[API] Supabase credentials missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
} catch (e) {
  console.error("[API] Failed to initialize Supabase client:", e);
}

export { supabase, supabaseUrl, supabaseServiceKey };
