import assert from "node:assert/strict";
import {
  MISSION_DURATION_MS,
  activeMilliseconds,
  missionTimerExpired,
  missionTimerSnapshot,
  pauseMissionTimer,
  resumeMissionTimer
} from "../src/missionTimer.js";

const record = {
  phase: "ACTIVE",
  mission: { startedAt: new Date(0).toISOString() },
  timer: { activeMs: 0, activeStartedAt: new Date(0).toISOString() }
};

assert.equal(activeMilliseconds(record, 10000), 10000);
pauseMissionTimer(record, 10000);
assert.equal(activeMilliseconds(record, 100000), 10000, "Paused handoff time must not consume mission time");
pauseMissionTimer(record, 200000);
assert.equal(activeMilliseconds(record, 200000), 10000, "Repeated pause must be idempotent");
resumeMissionTimer(record, 200000);
resumeMissionTimer(record, 210000);
assert.equal(activeMilliseconds(record, 215000), 25000, "Repeated resume must not duplicate active time");
pauseMissionTimer(record, 215000);
assert.equal(missionTimerSnapshot(record, 500000).remainingSeconds, 455, "Remaining time must survive refresh and handoff");
assert.equal(missionTimerExpired(record, MISSION_DURATION_MS), false);
record.timer.activeMs = MISSION_DURATION_MS;
assert.equal(missionTimerExpired(record, MISSION_DURATION_MS), true);

console.log("Mission timer validation passed: automatic pause/resume, idempotency, refresh preservation and expiry.");
