import { supabase } from "../../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, questionIds } = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
    if (!userName || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    for (const qId of questionIds) {
      const { data, error: selectError } = await supabase
        .from("question_views")
        .select("view_count")
        .eq("user_name", userName)
        .eq("question_id", qId)
        .maybeSingle();
      
      const currentCount = data?.view_count || 0;
      
      await supabase
        .from("question_views")
        .upsert({
          user_name: userName,
          question_id: qId,
          view_count: currentCount + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_name,question_id' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
