import cors from "cors";
import express from "express";
import missionRoutes from "./routes/missions.js";
import boothRoutes from "./routes/booth.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 4000;
const dist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
// Public mode (cloud): serve the built game from this process and expose only gameplay/leaderboard routes.
const publicMode = process.env.SERVE_FRONTEND === "true";

if (publicMode) {
  if (!existsSync(dist + "index.html")) throw new Error("SERVE_FRONTEND=true requires `npm run build` first");
  app.disable("x-powered-by");
  app.use((req, res, next) => { res.set("X-Content-Type-Options", "nosniff"); res.set("Referrer-Policy", "same-origin"); next(); });
  app.use("/api", (req, res, next) => {
    const path = req.originalUrl.split("?")[0];
    const allowed = req.method === "GET" && ["/api/health", "/api/booth/leaderboard"].includes(path) ||
      req.method === "POST" && (/^\/api\/booth\/independent\/CM-[A-Z0-9]{6}\/[1-4]\/(sync|poll|activate|desk|investigation|resolution)$/.test(path) ||
      /^\/api\/booth\/stations\/[1-4]\/(sync|poll|activate|heartbeat|release|desk|investigation|resolution)$/.test(path));
    if (!allowed) return res.status(404).json({ error: "Not found" });
    next();
  });
} else {
  app.use(cors({ origin: true }));
}
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store").json({ status: "ok", service: "cyber-mission-backend" });
});

app.use("/api/missions", missionRoutes);
app.use("/api/booth", boothRoutes);

if (publicMode) {
  app.use(express.static(dist, { index: false, dotfiles: "deny", maxAge: 0 }));
  app.get(["/", "/live-leaderboard"], (req, res) => res.set("Cache-Control", "no-store").sendFile(dist + "index.html"));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Cyber Mission backend listening on http://localhost:${port}`);
});
