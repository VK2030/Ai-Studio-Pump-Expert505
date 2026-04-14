import express from "express";
import cors from "cors";
import loginHandler from "./login.js";
import historyHandler from "./history.js";
import configHandler from "./config.js";
import questionsHandler from "./quiz/questions/[moduleId].js";
import checkHandler from "./quiz/check.js";
import viewsHandler from "./quiz/views/increment.js";
import syncHandler from "./admin/sync.js";
import healthHandler from "./health.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

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
app.post("/api/admin/sync", adapt(syncHandler));
app.get("/api/health", adapt(healthHandler));

// Fallback for legacy or other paths
app.use("/api/*", (req, res) => {
  console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "API Route not found" });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[API] Global Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

export default app;
