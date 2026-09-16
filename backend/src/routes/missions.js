import { Router } from "express";
import { createMission, getMission, updateMission } from "../controllers/missionController.js";

const router = Router();

router.post("/", createMission);
router.get("/:missionId", getMission);
router.patch("/:missionId", updateMission);

export default router;
