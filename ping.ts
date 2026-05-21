import { supabase } from "./api/_lib/supabase.js";

async function ping() {
  console.log("Ping starting...");
  try {
    const { data, error } = await supabase.from('results').select('count').limit(1);
    if (error) {
      console.error("Ping error:", error);
    } else {
      console.log("Ping success:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

ping();
