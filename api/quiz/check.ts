import fs from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moduleId, questionIdx, selectedOptions } = req.body;
    
    const questionsPath = path.join(process.cwd(), "api", "_lib", "questions.json");
    if (!fs.existsSync(questionsPath)) {
      console.error(`[API] Questions file NOT FOUND at: ${questionsPath}`);
      return res.status(404).json({ error: "Questions file not found" });
    }

    const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
    const questionsForModule = questionsData[moduleId] || [];
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
