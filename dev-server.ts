import app from "./api/index.js";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Local dev server running at http://localhost:${PORT}`);
  });
}

start();
