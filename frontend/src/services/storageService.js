const ACTIVE_MISSION_KEY = "cyberMission.activeMission";

export const storageService = {
  getActiveMission() {
    const rawMission = localStorage.getItem(ACTIVE_MISSION_KEY);
    return rawMission ? JSON.parse(rawMission) : null;
  },

  saveActiveMission(mission) {
    localStorage.setItem(ACTIVE_MISSION_KEY, JSON.stringify(mission));
  },

  clearActiveMission() {
    localStorage.removeItem(ACTIVE_MISSION_KEY);
  }
};
