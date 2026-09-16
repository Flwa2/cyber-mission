const ACTIVE_MISSION_KEY = "cyberMission.activeMission";
const LAST_STATION01_SCENARIO_KEY = "cyberMission.lastStation01Scenario";

export const storageService = {
  getActiveMission() {
    const rawMission = localStorage.getItem(ACTIVE_MISSION_KEY);
    return rawMission ? JSON.parse(rawMission) : null;
  },

  saveActiveMission(mission) {
    localStorage.setItem(ACTIVE_MISSION_KEY, JSON.stringify(mission));
  },

  getLastStation01ScenarioId() {
    return localStorage.getItem(LAST_STATION01_SCENARIO_KEY);
  },

  saveLastStation01ScenarioId(scenarioId) {
    localStorage.setItem(LAST_STATION01_SCENARIO_KEY, scenarioId);
  },

  clearActiveMission() {
    localStorage.removeItem(ACTIVE_MISSION_KEY);
  }
};
