import { supabase } from "../../_lib/supabase";
import { QUIZ_QUESTIONS } from "../../_lib/questions";

export default async function handler(req: any, res: any) {
  const { moduleId } = req.query;
  const { userName } = req.query;

  try {
    const questionsForModule = QUIZ_QUESTIONS[moduleId] || [];
    
    // Форматируем вопросы с ID
    const formattedQuestions = questionsForModule.map((q: any, i: number) => ({
      ...q,
      id: `${moduleId}_${i}`,
      viewCount: 0
    }));

    if (userName && supabase) {
      const { data: views, error: viewsError } = await supabase
        .from("question_views")
        .select("question_id, view_count")
        .eq("user_name", userName);
      
      if (!viewsError && views) {
        const viewMap = new Map(views.map((v: any) => [v.question_id, v.view_count]));
        const enrichedQuestions = formattedQuestions.map((q: any) => ({
          ...q,
          viewCount: viewMap.get(q.id) || 0
        }));
        return res.json(enrichedQuestions);
      }
    }

    res.json(formattedQuestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
