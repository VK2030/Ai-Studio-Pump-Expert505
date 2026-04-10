import express from "express";
import loginHandler from "./login";
import historyHandler from "./history";
import configHandler from "./config";
import questionsHandler from "./quiz/questions/[moduleId]";
import checkHandler from "./quiz/check";
import viewsHandler from "./quiz/views/increment";
import telegramHandler from "./telegram/send-summary";
import syncHandler from "./admin/sync";
import healthHandler from "./health";

const app = express();
app.use(express.json({ limit: '1mb' }));

// Helper to adapt Vercel handler to Express
const adapt = (handler: any) => async (req: any, res: any) => {
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error("Handler Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Routes
app.post("/api/login", adapt(loginHandler));
app.all("/api/history", adapt(historyHandler));
app.all("/api/config", adapt(configHandler));
app.get("/api/quiz/questions/:moduleId", (req, res) => {
  req.query.moduleId = req.params.moduleId;
  return adapt(questionsHandler)(req, res);
});
app.post("/api/quiz/check", adapt(checkHandler));
app.post("/api/quiz/views/increment", adapt(viewsHandler));
app.post("/api/telegram/send-summary", adapt(telegramHandler));
app.post("/api/admin/sync", adapt(syncHandler));
app.get("/api/health", adapt(healthHandler));

// Fallback for legacy or other paths
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API Route not found" });
});

export default app;
