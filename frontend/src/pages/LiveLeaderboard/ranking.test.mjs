import assert from 'node:assert/strict';
import {reconcileEntries} from './ranking.mjs';

const player = (missionId, score, completedStations = 1) => ({missionId, score, completedStations, playerName: missionId, avatarId: 'cyber-01'});
let rows = reconcileEntries([], [player('C', 100), player('A', 300), player('B', 200)]);
assert.deepEqual(rows.map(p => p.missionId), ['A', 'B', 'C']);
assert.equal(reconcileEntries(rows, [...rows].reverse().map(p => ({...p, rank: 99}))), rows);
const original = rows;
rows = reconcileEntries(rows, [player('C', 100), player('B', 250), player('A', 300)]);
assert.deepEqual(rows.map(p => p.missionId), ['A', 'B', 'C']);
assert.equal(rows[0], original[0]);
rows = reconcileEntries(rows, [player('A', 300), player('B', 350), player('C', 100)]);
assert.deepEqual(rows.map(p => p.missionId), ['B', 'A', 'C']);
rows = reconcileEntries(rows, [player('C', 500), player('B', 350), player('A', 300)]);
assert.deepEqual(rows.map(p => p.missionId), ['C', 'B', 'A']);
rows = reconcileEntries(rows, [player('C', 500, 4), player('B', 500, 1), player('A', 500, 0)]);
assert.deepEqual(rows.map(p => p.missionId), ['A', 'B', 'C']);
assert.equal(reconcileEntries(rows, [...rows].reverse()), rows);
assert.deepEqual(reconcileEntries(rows, rows.map(p => ({...p, completedStations: 4}))).map(p => p.missionId), ['A', 'B', 'C']);
for (const count of [10, 20, 50]) {
  let snapshot = Array.from({length: count}, (_, i) => player(`P-${String(i).padStart(2, '0')}`, 1000));
  for (let tick = 0; tick < 100; tick++) {
    snapshot = reconcileEntries(snapshot, snapshot.map((p, i) => ({...p, score: (p.score + i * 71 + tick) % 5001})).reverse());
    assert.equal(new Set(snapshot.map(p => p.missionId)).size, count);
    assert(snapshot.every((p, i) => i === 0 || snapshot[i - 1].score >= p.score));
  }
}
console.log('PASS score ordering, stable ties, progress independence, unchanged identity, 10/20/50 concurrent snapshots');
