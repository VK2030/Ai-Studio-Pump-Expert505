import { supabase, supabaseUrl, supabaseServiceKey } from "./_lib/supabase";
import { QUIZ_QUESTIONS } from "./_lib/questions";

export default async function handler(req: any, res: any) {
  try {
    const { count: settingsCount, error: sError } = supabase 
      ? await supabase.from("app_settings").select("*", { count: 'exact', head: true })
      : { count: 0, error: null };
    
    const modulesLoaded = Object.keys(QUIZ_QUESTIONS);
    const totalQuestions = modulesLoaded.reduce((acc, key) => acc + QUIZ_QUESTIONS[key].length, 0);

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
