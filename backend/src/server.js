import cors from "cors";
import express from "express";
import missionRoutes from "./routes/missions.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "cyber-mission-backend" });
});

app.use("/api/missions", missionRoutes);

app.listen(port, () => {
  console.log(`Cyber Mission backend listening on http://localhost:${port}`);
});
