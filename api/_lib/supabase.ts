import { createClient } from "@supabase/supabase-js";

console.log("[API] supabase.ts initializing");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let supabase: any = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (e) {
  console.error("[API] Failed to initialize Supabase client:", e);
}

export { supabase, supabaseUrl, supabaseServiceKey };
