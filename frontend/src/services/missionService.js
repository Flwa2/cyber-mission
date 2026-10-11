import { GAME_CONFIG } from "../config/gameConfig.js";
import { generateMissionId } from "../utils/generateMissionId.js";
import { applyAction } from "../utils/scoringEngine.js";
import { ensureStation01State } from "../utils/station01Engine.js";
import { storageService } from "./storageService.js";
import { normalizeLanguage } from "../../../shared/language.mjs";
import { PLAYER_AVATAR_IDS } from "../../../shared/playerAvatars.mjs";

const MAX_PLAYER_NAME_LENGTH = 40;

function ensurePreparedAvatar(mission) {
  if (mission?.status !== "prepared" || PLAYER_AVATAR_IDS.includes(mission.avatarId)) return mission;
  const updatedMission = { ...mission, avatarId: PLAYER_AVATAR_IDS[0] };
  storageService.saveActiveMission(updatedMission);
  return updatedMission;
}

function createBaseMission(prepared = false, language) {
  const now = new Date().toISOString();

  return {
    missionId: generateMissionId(),
    language: normalizeLanguage(language),
    playerName: "",
    avatarId: PLAYER_AVATAR_IDS[0],
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
  prepareMission(language) {
    const existing = ensurePreparedAvatar(storageService.getActiveMission());
    if (existing) return existing;
    const mission = createBaseMission(true, language);
    storageService.saveActiveMission(mission);
    return mission;
  },

  setPlayerName(playerName) {
    if (typeof playerName !== "string") throw new TypeError("Player name must be a string");
    if (playerName.length > MAX_PLAYER_NAME_LENGTH) throw new RangeError("Player name must be 40 characters or fewer");
    const prepared = storageService.getActiveMission();
    if (!prepared || prepared.status !== "prepared") return prepared;
    const mission = { ...prepared, playerName, updatedAt: new Date().toISOString() };
    storageService.saveActiveMission(mission);
    return mission;
  },

  setAvatarId(avatarId) {
    if (!PLAYER_AVATAR_IDS.includes(avatarId)) throw new RangeError("Unknown player avatar");
    const prepared = storageService.getActiveMission();
    if (!prepared || prepared.status !== "prepared") return prepared;
    const mission = { ...prepared, avatarId, updatedAt: new Date().toISOString() };
    storageService.saveActiveMission(mission);
    return mission;
  },

  beginMission() {
    const prepared = storageService.getActiveMission();
    if (!prepared || prepared.status !== "prepared" || prepared.startedAt) return prepared;
    const playerName = typeof prepared.playerName === "string" ? prepared.playerName.trim() : "";
    if (!playerName || playerName.length > MAX_PLAYER_NAME_LENGTH) return prepared;
    const avatarId = PLAYER_AVATAR_IDS.includes(prepared.avatarId) ? prepared.avatarId : PLAYER_AVATAR_IDS[0];
    const now = new Date().toISOString();
    const mission = ensureStation01State(
      { ...prepared, playerName, avatarId, status: "active", startedAt: now, updatedAt: now },
      storageService.getLastStation01ScenarioId()
    );
    return this.saveMission(mission);
  },

  cancelPreparation() {
    if (storageService.getActiveMission()?.status === "prepared") storageService.clearActiveMission();
    return storageService.getActiveMission();
  },

  createMission(language) {
    const mission = ensureStation01State(createBaseMission(false, language), storageService.getLastStation01ScenarioId());
    storageService.saveLastStation01ScenarioId(mission.decisions.station01.scenarioId);
    storageService.saveActiveMission(mission);
    return mission;
  },

  getActiveMission() {
    return ensurePreparedAvatar(storageService.getActiveMission());
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
