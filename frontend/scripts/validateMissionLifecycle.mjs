import assert from "node:assert/strict";
import { missionService } from "../src/services/missionService.js";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key)
};

const prepared = missionService.prepareMission();
assert.equal(prepared.status, "prepared");
assert.equal(prepared.startedAt, null);
assert.deepEqual(prepared.decisions, {});
assert.equal(localStorage.getItem("cyberMission.lastStation01Scenario"), null);
assert.deepEqual(missionService.prepareMission(), prepared);
assert.deepEqual(missionService.getActiveMission(), prepared);
assert.equal(missionService.cancelPreparation(), null);
assert.equal(localStorage.getItem("cyberMission.lastStation01Scenario"), null);

const ready = missionService.prepareMission();
const active = missionService.beginMission();
assert.equal(active.missionId, ready.missionId);
assert.equal(active.createdAt, ready.createdAt);
assert.equal(active.status, "active");
assert.ok(active.startedAt);
assert.ok(active.decisions.station01.scenarioId);
assert.deepEqual(missionService.beginMission(), active);
assert.deepEqual(missionService.prepareMission(), active);
assert.deepEqual(missionService.cancelPreparation(), active);
assert.deepEqual(missionService.getActiveMission(), active);
assert.equal(active.hiddenScore, 0);
assert.equal(active.hiddenAttackState, 0);
assert.deepEqual(active.completedStations, []);
missionService.clearMission();
assert.equal(missionService.beginMission(), null);
console.log("Mission preparation, activation, idempotency and recovery validation passed");
