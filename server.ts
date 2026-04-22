import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "running", time: new Date().toISOString() });
  });

  // API Route: Configuration for Xiaozhi Client
  // This endpoint can be used by the R1 to get its settings
  app.get("/api/config", (req, res) => {
    res.json({
      ai_mode: "gemini",
      model: "gemini-3-flash-preview",
      voice_id: "Kore",
      instructions: "You are a helpful assistant for a Phicomm R1 smart speaker user."
    });
  });

  // Proxy/Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Xiaozhi Hub] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
