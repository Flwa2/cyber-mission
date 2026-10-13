import cors from "cors";
import express from "express";
import missionRoutes from "./routes/missions.js";
import boothRoutes from "./routes/booth.js";
import adminRoutes, { startAdmin } from "./adminRoutes.js";
import { persistentStore, storeStats } from "./persistentStore.js";
import { monitorEventLoopDelay } from "node:perf_hooks";
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
      req.method === "POST" && /^\/api\/admin\/(login|logout|events|events\/[a-z0-9-]+\/(activate|archive)|start)$/.test(path) ||
      req.method === "DELETE" && /^\/api\/admin\/events\/[a-z0-9-]+$/.test(path);
    if (!allowed) return res.status(404).json({ error: "Not found" });
    next();
  });
} else {
  app.use(cors({ origin: true }));
}
app.use(express.json());

// Per-request timing for telemetry (counts and slow requests only; no bodies, no credentials).
const http = { requests: 0, errors5xx: 0, slow: 0, inflight: 0, maxInflight: 0 };
app.use("/api", (req, res, next) => {
  const started = performance.now();
  http.requests++; http.inflight++; http.maxInflight = Math.max(http.maxInflight, http.inflight);
  res.on("close", () => {
    http.inflight--;
    const ms = performance.now() - started;
    if (res.statusCode >= 500) http.errors5xx++;
    if (ms > 1000) { http.slow++; console.error(JSON.stringify({ event: "slow-request", method: req.method, path: req.path.replace(/CM-[A-Z0-9]{6}/, "CM-******"), status: res.statusCode, ms: Math.round(ms) })); }
  });
  next();
});

// 503 only when this instance must not serve (superseded or unrecoverable write failure). A transient
// database error is reported as "degraded" and self-heals; it must not make Render restart the service.
app.get("/api/health", (req, res) => {
  try { persistentStore.assertHealthy(); } catch { return res.status(503).json({ status: "unavailable", service: "cyber-mission-backend" }); }
  res.set("Cache-Control", "no-store").json({ status: persistentStore.status().degraded ? "degraded" : "ok", service: "cyber-mission-backend" });
});

app.use("/api/missions", missionRoutes);
app.use("/api/booth", boothRoutes);
await startAdmin();
app.use("/api/admin", adminRoutes);

if (publicMode) {
  app.use(express.static(dist, { index: false, dotfiles: "deny", maxAge: 0, setHeaders(res, path) {
    // Hashed build output never changes; unhashed images revalidate cheaply and survive flaky Wi-Fi.
    if (/-[A-Za-z0-9_-]{8}\.(js|css)$/.test(path)) res.set("Cache-Control", "public, max-age=31536000, immutable");
    else if (/\.(png|jpe?g|webp|avif|svg|woff2?|mp3|ogg|wav)$/i.test(path)) res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  } }));
  app.get(["/", "/live-leaderboard"], (req, res) => res.set("Cache-Control", "no-store").sendFile(dist + "index.html"));
}

// Never expose database errors or connection details through Express's default handler.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.transient) return res.status(503).set("Retry-After", "2").json({ error: "Storage temporarily unavailable; please retry" });
  res.status(500).json({ error: "Unable to persist mission state" });
});

// A single bad request must not take down every player: log and keep serving. A flood still exits
// so Render restarts a genuinely broken process.
const crashes = [];
const survive = kind => error => {
  console.error(JSON.stringify({ event: kind, message: String(error?.message || error).slice(0, 300) }));
  const now = Date.now();
  crashes.push(now);
  while (crashes.length && now - crashes[0] > 60000) crashes.shift();
  if (crashes.length > 10) { console.error("Too many unhandled errors; exiting for restart"); process.exit(1); }
};
process.on("unhandledRejection", survive("unhandledRejection"));
process.on("uncaughtException", survive("uncaughtException"));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Cyber Mission backend listening on http://localhost:${port}`);
});
// Render's proxy reuses connections for up to 60s; Node's 5s default causes intermittent 502s.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();
const telemetryMs = Number(process.env.TELEMETRY_LOG_MS) || (process.env.NODE_ENV === "production" ? 60000 : 0);
if (telemetryMs) {
  let lastCpu = process.cpuUsage(), lastAt = Date.now();
  setInterval(() => {
    const cpu = process.cpuUsage(lastCpu), wall = Date.now() - lastAt;
    lastCpu = process.cpuUsage(); lastAt = Date.now();
    const mem = process.memoryUsage();
    console.log(JSON.stringify({ telemetry: true, rssMb: Math.round(mem.rss / 1048576), heapMb: Math.round(mem.heapUsed / 1048576),
      cpuPct: Math.round((cpu.user + cpu.system) / 1000 / wall * 100), loopP99Ms: Math.round(loopDelay.percentile(99) / 1e6), loopMaxMs: Math.round(loopDelay.max / 1e6),
      http: { ...http }, store: { ...storeStats, ...persistentStore.status() } }));
    loopDelay.reset(); http.maxInflight = http.inflight;
  }, telemetryMs).unref();
}

// Graceful stop on Render deploys/restarts: finish in-flight writes before the process ends.
let stopping = false;
const shutdown = async signal => {
  if (stopping) return;
  stopping = true;
  console.log(`${signal} received; draining`);
  const force = setTimeout(() => process.exit(0), 8000); force.unref();
  server.close();
  try { await persistentStore.flush(); await persistentStore.close(); } catch { /* exiting anyway */ }
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));