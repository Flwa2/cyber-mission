import { missionService } from "../services/missionService.js";

export function createMission(req, res) {
  const { missionId } = req.body;

  if (!missionId) {
    return res.status(400).json({ error: "missionId is required" });
  }

  const mission = missionService.createMission({ missionId });
  return res.status(201).json({ mission });
}

export function getMission(req, res) {
  const mission = missionService.getMission(req.params.missionId);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  return res.json({ mission });
}

export function updateMission(req, res) {
  const mission = missionService.updateMission(req.params.missionId, req.body);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  return res.json({ mission });
}
