import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle private key newlines correctly
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin initialized");
    } catch (error: any) {
      console.error("Firebase initialization error:", error.message);
    }
  }

  const db = admin.firestore();
  app.use(express.json());

  // API: Get history from Firestore
  app.get("/api/history", async (req, res) => {
    try {
      const snapshot = await db.collection("quiz_history")
        .orderBy("created_at", "desc")
        .limit(100)
        .get();

      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching history:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Save history entry to Firestore
  app.post("/api/history", async (req, res) => {
    try {
      const entry = req.body;
      const docRef = await db.collection("quiz_history").add({
        moduleId: entry.moduleId,
        score: entry.score,
        session: entry.session,
        incorrectAnswers: entry.incorrectAnswers,
        date: entry.date,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ id: docRef.id, ...entry });
    } catch (error: any) {
      console.error("Error saving history:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
