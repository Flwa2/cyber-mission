import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { missionService } from "../services/missionService.js";

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  const [mission, setMission] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMission(missionService.getActiveMission());
    setIsLoaded(true);
  }, []);

  const value = useMemo(
    () => ({
      mission,
      isLoaded,
      startMission() {
        const nextMission = missionService.createMission();
        setMission(nextMission);
        return nextMission;
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
      resetMission() {
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
