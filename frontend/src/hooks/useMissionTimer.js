import { useEffect, useMemo, useState } from "react";
import { GAME_CONFIG } from "../config/gameConfig.js";

function calculateRemainingSeconds(startedAt, timer, durationSeconds) {
  if (!startedAt) {
    return durationSeconds;
  }

  if (timer && Number.isFinite(timer.activeMs)) {
    const runningMs = timer.running && timer.activeStartedAt
      ? Math.max(0, Date.now() - new Date(timer.activeStartedAt).getTime())
      : 0;
    return Math.max(0, Math.ceil((durationSeconds * 1000 - timer.activeMs - runningMs) / 1000));
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(durationSeconds - elapsedSeconds, 0);
}

export function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function useMissionTimer(startedAt, timer) {
  const durationSeconds = GAME_CONFIG.missionDurationSeconds;
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(startedAt, timer, durationSeconds)
  );

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(startedAt, timer, durationSeconds));

    const intervalId = window.setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(startedAt, timer, durationSeconds));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt, timer, durationSeconds]);

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
