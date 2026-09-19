import { GAME_CONFIG } from "../config/gameConfig.js";
import { generateMissionId } from "../utils/generateMissionId.js";
import { applyAction } from "../utils/scoringEngine.js";
import { ensureStation01State } from "../utils/station01Engine.js";
import { storageService } from "./storageService.js";

function createBaseMission(prepared = false) {
  const now = new Date().toISOString();

  return {
    missionId: generateMissionId(),
    createdAt: now,
    startedAt: prepared ? null : now,
    updatedAt: now,
    status: prepared ? "prepared" : "active",
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
  prepareMission() {
    const existing = storageService.getActiveMission();
    if (existing) return existing;
    const mission = createBaseMission(true);
    storageService.saveActiveMission(mission);
    return mission;
  },

  beginMission() {
    const prepared = storageService.getActiveMission();
    if (!prepared || prepared.status !== "prepared" || prepared.startedAt) return prepared;
    const now = new Date().toISOString();
    const mission = ensureStation01State(
      { ...prepared, status: "active", startedAt: now, updatedAt: now },
      storageService.getLastStation01ScenarioId()
    );
    return this.saveMission(mission);
  },

  cancelPreparation() {
    if (storageService.getActiveMission()?.status === "prepared") storageService.clearActiveMission();
    return storageService.getActiveMission();
  },

  createMission() {
    const mission = ensureStation01State(createBaseMission(), storageService.getLastStation01ScenarioId());
    storageService.saveLastStation01ScenarioId(mission.decisions.station01.scenarioId);
    storageService.saveActiveMission(mission);
    return mission;
  },

  getActiveMission() {
    return storageService.getActiveMission();
  },

  saveMission(mission) {
    storageService.saveActiveMission(mission);
    if (mission.decisions?.station01?.scenarioId) {
      storageService.saveLastStation01ScenarioId(mission.decisions.station01.scenarioId);
    }
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
