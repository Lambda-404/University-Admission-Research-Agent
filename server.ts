import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { AdmissionResearchAgent } from "./src/server/agentService";

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json({ limit: "20mb" }));

const agentService = new AdmissionResearchAgent();

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/research/list", (req, res) => {
  const sessions = agentService.getAllSessions();
  res.json({ sessions });
});

app.post("/api/research/start", async (req, res) => {
  try {
    const { university, major } = req.body;
    if (!university || !major) {
      return res.status(400).json({ error: "Both 'university' and 'major' are required parameters." });
    }

    const session = await agentService.startResearch(university, major);
    res.json({ success: true, session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start research session";
    console.error("Start research error:", error);
    res.status(500).json({ error: message });
  }
});

app.get("/api/research/:id", (req, res) => {
  const session = agentService.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Research session not found" });
  }
  res.json({ session });
});

app.post("/api/research/:id/pause", (req, res) => {
  agentService.pauseResearch(req.params.id);
  res.json({ success: true });
});

app.post("/api/research/:id/resume", (req, res) => {
  agentService.resumeResearch(req.params.id);
  res.json({ success: true });
});

app.post("/api/research/:id/stop", async (req, res) => {
  await agentService.stopResearch(req.params.id);
  res.json({ success: true });
});

// --- WEBSOCKET REALTIME STREAMING ---

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  if (url.pathname === "/ws/research") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws: WebSocket, request: http.IncomingMessage) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const researchId = url.searchParams.get("researchId");

  if (researchId) {
    agentService.registerWSClient(researchId, ws);
  }
});

// --- VITE MIDDLEWARE / STATIC SERVING ---

async function startServer() {
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`University Admission Research Agent server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
