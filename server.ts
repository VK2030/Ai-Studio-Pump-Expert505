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
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase environment variables are missing!");
    console.log("Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
  }

  if (!admin.apps.length && projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (error: any) {
      console.error("❌ Firebase initialization error:", error.message);
    }
  }

  const db = admin.firestore();
  app.use(express.json());

  // API: Debug Firebase connection
  app.get("/api/debug/firebase", (req, res) => {
    res.json({
      configured: !!(projectId && clientEmail && privateKey),
      projectId: projectId || "MISSING",
      clientEmail: clientEmail || "MISSING",
      hasPrivateKey: !!privateKey,
      initialized: admin.apps.length > 0
    });
  });

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
