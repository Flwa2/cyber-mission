import { missionService } from "../services/missionService.js";

export async function createMission(req, res, next) {
  try {
  const { missionId } = req.body;

  if (!missionId) {
    return res.status(400).json({ error: "missionId is required" });
  }

  const mission = await missionService.createMission({ missionId });
  return res.status(201).json({ mission });
  } catch (error) { next(error); }
}

export function getMission(req, res) {
  const mission = missionService.getMission(req.params.missionId);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  return res.json({ mission });
}

export async function updateMission(req, res, next) {
  try {
  const mission = await missionService.updateMission(req.params.missionId, req.body);

  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  return res.json({ mission });
  } catch (error) { next(error); }
}
