console.log("[API] supabase.ts loading...");
import { createClient } from "@supabase/supabase-js";
console.log("[API] supabase.ts: createClient imported");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (error) {
    console.error("Supabase initialization failed:", error);
  }
}

export { supabase, supabaseUrl, supabaseServiceKey };
