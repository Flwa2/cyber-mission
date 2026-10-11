export const MISSION_DURATION_MS = 480000;

function timerFor(record, now = Date.now()) {
  if (!record.timer || typeof record.timer !== "object") {
    const startedAt = Date.parse(record.mission?.startedAt);
    record.timer = {
      activeMs: Number.isFinite(startedAt) && record.phase !== "QUEUED" ? Math.max(0, now - startedAt) : 0,
      activeStartedAt: null
    };
  }
  record.timer.activeMs = Number.isFinite(record.timer.activeMs) ? Math.max(0, record.timer.activeMs) : 0;
  if (record.timer.activeStartedAt !== null && !Number.isFinite(Date.parse(record.timer.activeStartedAt))) {
    record.timer.activeStartedAt = null;
  }
  return record.timer;
}

export function activeMilliseconds(record, now = Date.now()) {
  const timer = timerFor(record, now);
  return timer.activeMs + (timer.activeStartedAt ? Math.max(0, now - Date.parse(timer.activeStartedAt)) : 0);
}

export function pauseMissionTimer(record, now = Date.now()) {
  const timer = timerFor(record, now);
  timer.activeMs = activeMilliseconds(record, now);
  timer.activeStartedAt = null;
}

export function resumeMissionTimer(record, now = Date.now()) {
  const timer = timerFor(record, now);
  if (!timer.activeStartedAt) timer.activeStartedAt = new Date(now).toISOString();
}

export function missionTimerSnapshot(record, now = Date.now()) {
  const activeMs = Math.min(MISSION_DURATION_MS, activeMilliseconds(record, now));
  return {
    activeMs,
    activeStartedAt: timerFor(record, now).activeStartedAt,
    running: Boolean(timerFor(record, now).activeStartedAt),
    remainingSeconds: Math.max(0, Math.ceil((MISSION_DURATION_MS - activeMs) / 1000))
  };
}

export function missionTimerExpired(record, now = Date.now()) {
  return activeMilliseconds(record, now) >= MISSION_DURATION_MS;
}
