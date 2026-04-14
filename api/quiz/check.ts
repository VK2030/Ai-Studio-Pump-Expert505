import { createRequire } from "module";
const require = createRequire(import.meta.url);
const questionsData = require("../_lib/questions.json");

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId, questionIdx, selectedOptions } = req.body;
    
    if (!questionsData) {
      return res.status(500).json({ error: "Questions data missing" });
    }

    const questionsForModule = (questionsData as any)[moduleId] || [];
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
