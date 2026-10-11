import { createMissionRecord } from "../models/Mission.js";

import { persistentStore } from "../persistentStore.js";

export const missionService = {
  createMission({ missionId }) {
    return persistentStore.transaction(state => {
      const missions = state.legacyMissions ||= {};
      if (Object.hasOwn(missions, missionId)) return missions[missionId];
      const mission = createMissionRecord({ missionId });
      Object.defineProperty(missions, missionId, { value:mission, enumerable:true, writable:true, configurable:true });
      return mission;
    });
  },

  getMission(missionId) {
    const missions = persistentStore.read().legacyMissions || {};
    return Object.hasOwn(missions, missionId) ? missions[missionId] : null;
  },

  updateMission(missionId, updates) {
    return persistentStore.transaction(state => {
      const missions = state.legacyMissions || {};
      const existingMission = Object.hasOwn(missions, missionId) ? missions[missionId] : null;

      if (!existingMission) {
        return null;
      }

      const updatedMission = {
        ...existingMission,
        ...updates,
        missionId: existingMission.missionId,
        updatedAt: new Date().toISOString()
      };

      missions[missionId] = updatedMission;
      return updatedMission;
    });
  }
};
