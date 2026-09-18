import { DEV_PAUSE_MISSION_TIMER } from "../config/developmentConfig.js";
import { useEffect, useMemo, useState } from "react";
import { GAME_CONFIG } from "../config/gameConfig.js";

function calculateRemainingSeconds(startedAt, durationSeconds) {
  if (DEV_PAUSE_MISSION_TIMER || !startedAt) {
    return durationSeconds;
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(durationSeconds - elapsedSeconds, 0);
}

export function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function useMissionTimer(startedAt) {
  const durationSeconds = GAME_CONFIG.missionDurationSeconds;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(startedAt, durationSeconds)
  );

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(startedAt, durationSeconds));

    if (DEV_PAUSE_MISSION_TIMER) return undefined;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(startedAt, durationSeconds));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt, durationSeconds]);

  return useMemo(
    () => ({
      remainingSeconds,
      elapsedSeconds: durationSeconds - remainingSeconds,
      isExpired: remainingSeconds <= 0,
      displayTime: formatTimer(remainingSeconds)
    }),
    [durationSeconds, remainingSeconds]
  );
}
