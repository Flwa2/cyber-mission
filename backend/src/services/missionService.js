import { createMissionRecord } from "../models/Mission.js";

const missions = new Map();

export const missionService = {
  createMission({ missionId }) {
    const mission = createMissionRecord({ missionId });
    missions.set(mission.missionId, mission);
    return mission;
  },

  getMission(missionId) {
    return missions.get(missionId) || null;
  },

  updateMission(missionId, updates) {
    const existingMission = missions.get(missionId);

    if (!existingMission) {
      return null;
    }

    const updatedMission = {
      ...existingMission,
      ...updates,
      missionId: existingMission.missionId,
      updatedAt: new Date().toISOString()
    };

    missions.set(missionId, updatedMission);
    return updatedMission;
  }
};
