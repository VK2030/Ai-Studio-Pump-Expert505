import { QUIZ_QUESTIONS } from "../_lib/questions";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId, questionIdx, selectedOptions } = req.body;
    
    const questionsForModule = QUIZ_QUESTIONS[moduleId] || [];
    const question = questionsForModule[questionIdx];

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const isCorrect = JSON.stringify(selectedOptions.sort()) === JSON.stringify(question.correct.sort());
    
    res.json({
      isCorrect,
      correctOptions: question.correct
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
