// One-time import of a local booth-state.json into the cloud store. Read-only for local files;
// refuses to touch an existing cloud row. Usage:
//   DATABASE_URL=... node backend/scripts/importStateToPostgres.mjs <booth-state.json> [leaderboard-event.json]
import { readFileSync } from 'node:fs';
import { createPool, ensureTable } from '../src/cloudStore.js';

const [stateFile, eventFile] = process.argv.slice(2);
if (!process.env.DATABASE_URL || !stateFile) { console.error('Usage: DATABASE_URL=... node importStateToPostgres.mjs <booth-state.json> [leaderboard-event.json]'); process.exit(2); }
const read = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const state = read(stateFile);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
if (!object(state) || !Number.isSafeInteger(state.sequence) || !object(state.missions) || !object(state.stations)) throw new Error('Not a valid booth store');
if (eventFile) {
  const event = read(eventFile);
  state.leaderboardEvent = { eventId: event.eventId, resetAt: event.resetAt, excludedMissionIds: event.excludedMissionIds || [] };
}
const contents = JSON.stringify(state);
const db = createPool(process.env.DATABASE_URL);
try {
  await ensureTable(db);
  const inserted = await db.query('insert into booth_store(id, epoch, state) values (1, 0, $1::jsonb) on conflict (id) do nothing', [contents]);
  if (!inserted.rowCount) throw new Error('Cloud store already has data; refusing to overwrite it');
  const check = (await db.query('select state from booth_store where id = 1')).rows[0].state;
  const canon = v => Array.isArray(v) ? v.map(canon) : object(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
  const same = JSON.stringify(canon(check)) === JSON.stringify(canon(state));
  console.log(JSON.stringify({ imported: true, missions: Object.keys(state.missions).length, sequence: check.sequence, excludedByEvent: check.leaderboardEvent?.excludedMissionIds?.length ?? 0, verified: same }));
  if (!same) process.exit(1);
} finally { await db.end(); }
