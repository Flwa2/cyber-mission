import cors from "cors";
import express from "express";
import missionRoutes from "./routes/missions.js";
import boothRoutes from "./routes/booth.js";
import adminRoutes, { startAdmin } from "./adminRoutes.js";
import { persistentStore } from "./persistentStore.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 4000;
const dist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
// Public mode (cloud): serve the built game from this process and expose only gameplay/leaderboard routes.
const publicMode = process.env.SERVE_FRONTEND === "true";

if (publicMode) {
  if ((process.env.ADMIN_PASSWORD || '').length < 12 || (process.env.ADMIN_SESSION_SECRET || '').length < 32) {
    throw new Error("SERVE_FRONTEND=true requires ADMIN_PASSWORD (>=12 chars) and ADMIN_SESSION_SECRET (>=32 chars)");
  }
  if (!existsSync(dist + "index.html")) throw new Error("SERVE_FRONTEND=true requires `npm run build` first");
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => { res.set("X-Content-Type-Options", "nosniff"); res.set("Referrer-Policy", "same-origin"); next(); });
  app.use("/api", (req, res, next) => {
    const path = req.originalUrl.split("?")[0];
    const allowed = req.method === "GET" && (["/api/health", "/api/booth/leaderboard", "/api/booth/events"].includes(path) || /^\/api\/booth\/events\/[a-z0-9-]+\/leaderboard$/.test(path)) ||
      req.method === "POST" && (/^\/api\/booth\/independent\/CM-[A-Z0-9]{6}\/[1-4]\/(sync|poll|activate|desk|investigation|resolution)$/.test(path) ||
      /^\/api\/booth\/stations\/[1-4]\/(sync|poll|activate|heartbeat|release|desk|investigation|resolution)$/.test(path)) ||
      // Event management: authenticated server-side by adminRoutes.
      /^\/api\/admin\/(session|events|events\/[a-z0-9-]+|events\/[a-z0-9-]+\/leaderboard)$/.test(path) && req.method === "GET" ||
      req.method === "POST" && /^\/api\/admin\/(login|logout|events|events\/[a-z0-9-]+\/(activate|archive)|start)$/.test(path);
    if (!allowed) return res.status(404).json({ error: "Not found" });
    next();
  });
} else {
  app.use(cors({ origin: true }));
}
app.use(express.json());

app.get("/api/health", (req, res) => {
  try { persistentStore.assertHealthy(); } catch { return res.status(503).json({ status: "unavailable", service: "cyber-mission-backend" }); }
  res.set("Cache-Control", "no-store").json({ status: "ok", service: "cyber-mission-backend" });
});

app.use("/api/missions", missionRoutes);
app.use("/api/booth", boothRoutes);
await startAdmin();
app.use("/api/admin", adminRoutes);

if (publicMode) {
  app.use(express.static(dist, { index: false, dotfiles: "deny", maxAge: 0 }));
  app.get(["/", "/live-leaderboard"], (req, res) => res.set("Cache-Control", "no-store").sendFile(dist + "index.html"));
}

// Never expose database errors or connection details through Express's default handler.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Unable to persist mission state" });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Cyber Mission backend listening on http://localhost:${port}`);
});
