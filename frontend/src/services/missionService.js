import { GAME_CONFIG } from "../config/gameConfig.js";
import { generateMissionId } from "../utils/generateMissionId.js";
import { applyAction } from "../utils/scoringEngine.js";
import { storageService } from "./storageService.js";

function createBaseMission() {
  const now = new Date().toISOString();

  return {
    missionId: generateMissionId(),
    createdAt: now,
    startedAt: now,
    updatedAt: now,
    status: "active",
    currentStation: 1,
    completedStations: [],
    hiddenScore: 0,
    hiddenAttackState: 0,
    evidence: [],
    decisions: {},
    flags: {
      suspiciousLinkOpened: false,
      accountExposurePossible: false,
      phishingReported: false,
      legitimateMessageReported: false,
      unknownUsbConnected: false,
      physicalThreatContained: false,
      criticalEvidenceMissed: false,
      incidentReported: false
    },
    configSnapshot: {
      missionDurationSeconds: GAME_CONFIG.missionDurationSeconds,
      stationCount: GAME_CONFIG.stationCount
    }
  };
}

export const missionService = {
  createMission() {
    const mission = createBaseMission();
    storageService.saveActiveMission(mission);
    return mission;
  },

  getActiveMission() {
    return storageService.getActiveMission();
  },

  saveMission(mission) {
    storageService.saveActiveMission(mission);
    return mission;
  },

  recordAction(mission, actionName, payload) {
    const updatedMission = applyAction(mission, actionName, payload);
    storageService.saveActiveMission(updatedMission);
    return updatedMission;
  },

  completeStation(mission, stationNumber) {
    const completedStations = Array.from(new Set([...mission.completedStations, stationNumber]));
    const updatedMission = {
      ...mission,
      completedStations,
      currentStation: Math.min(stationNumber + 1, GAME_CONFIG.stationCount),
      updatedAt: new Date().toISOString()
    };

    storageService.saveActiveMission(updatedMission);
    return updatedMission;
  },

  clearMission() {
    storageService.clearActiveMission();
  }
};
