import { supabase, supabaseUrl, supabaseServiceKey } from "./_lib/supabase";
import fs from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
  try {
    const { count: settingsCount, error: sError } = supabase 
      ? await supabase.from("app_settings").select("*", { count: 'exact', head: true })
      : { count: 0, error: null };
    
    const questionsPath = path.join(process.cwd(), "api", "_lib", "questions.json");
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
    const modulesLoaded = Object.keys(questionsData);
    const totalQuestions = modulesLoaded.reduce((acc, key) => acc + questionsData[key].length, 0);

    res.json({ 
      status: "ok", 
      settings: { count: settingsCount, error: sError },
      questions: {
        modules: modulesLoaded,
        total: totalQuestions
      },
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      }
    });
  } catch (e: any) {
    res.json({ status: "error", message: e.message });
  }
}
