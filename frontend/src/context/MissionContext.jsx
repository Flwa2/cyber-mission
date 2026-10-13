import {ACTIVE_MISSION_KEY} from '../services/storageService.js';
import {INDEPENDENT_MODE} from '../booth/playMode.js';
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { missionService } from "../services/missionService.js";
import { stationRequest } from "../booth/boothApi.js";

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  const [mission, setMission] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMission(missionService.getActiveMission());
    setIsLoaded(true);
    const syncTab = event => {
      if (event.key === ACTIVE_MISSION_KEY) setMission(missionService.getActiveMission());
    };
    window.addEventListener("storage", syncTab);
    return () => window.removeEventListener("storage", syncTab);
  }, []);

  const value = useMemo(
    () => ({
      mission,
      isLoaded,
      prepareMission(language) {
        const nextMission = missionService.prepareMission(language);
        setMission(nextMission);
        return nextMission;
      },
      setPlayerName(playerName) {
        const nextMission = missionService.setPlayerName(playerName);
        setMission(nextMission);
        return nextMission;
      },
      setAvatarId(avatarId) {
        const nextMission = missionService.setAvatarId(avatarId);
        setMission(nextMission);
        return nextMission;
      },
      beginMission() {
        const nextMission = missionService.beginMission();
        setMission(nextMission);
        return nextMission;
      },
      cancelPreparation() {
        setMission(missionService.cancelPreparation());
      },
      saveMission(nextMission) {
        const savedMission = missionService.saveMission(nextMission);
        setMission(savedMission);
        return savedMission;
      },
      recordAction(actionName, payload) {
        if (!mission) return null;
        const updatedMission = missionService.recordAction(mission, actionName, payload);
        setMission(updatedMission);
        return updatedMission;
      },
      updateMission(updater) {
        if (!mission) return null;
        const current = missionService.getActiveMission();
        if (current?.missionId !== mission.missionId) { setMission(current); return current; }
        const nextMission = typeof updater === "function" ? updater(current) : updater;
        const savedMission = missionService.saveMission(nextMission);
        setMission(savedMission);
        return savedMission;
      },
      detachMission(expectedId = mission?.missionId) {
        const current = missionService.getActiveMission();
        if (current?.missionId !== expectedId) { setMission(current); return; }
        missionService.clearMission();
        setMission(null);
      },
      // Confirmed exit: the server records the mission as abandoned before this screen detaches.
      async abandonMission() {
        if (mission?.startedAt) {
          try { await stationRequest("abandon", { missionId: mission.missionId }); }
          catch (error) { if (error?.transient) throw error; }
          if (!INDEPENDENT_MODE) {
            try { await stationRequest("release", { missionId: mission.missionId, immediate: true }); } catch { /* lease expires on its own */ }
          }
        }
        missionService.clearMission();
        setMission(null);
      },
      async resetMission() {
        if (mission?.startedAt && !INDEPENDENT_MODE) {
          try {
            const result = await stationRequest("release", { missionId: mission.missionId, immediate: true });
            if (!result.released) return;
          } catch { return; }
        }
        missionService.clearMission();
        setMission(null);
      }
    }),
    [isLoaded, mission]
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const context = useContext(MissionContext);

  if (!context) {
    throw new Error("useMission must be used inside MissionProvider");
  }

  return context;
}
