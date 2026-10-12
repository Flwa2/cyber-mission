import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPool } from '../src/cloudStore.js';
import { importDocumentToRows, loadRowsState, openRowsStore } from '../src/rowsStore.js';

// Row-per-mission store: restore, durability, failure self-healing, fencing. Disposable local DB only.
const url = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
assert(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname.endsWith('_test'), 'Use a disposable localhost *_test database');
process.env.DATABASE_SSL = 'disable';
const db = createPool(url.href);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
assert(process.argv[2], 'Supply the verified JSON backup to restore only into the disposable local database');
const backup = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const original = backup.rows[0].state;
const baseline = JSON.parse(readFileSync(fileURLToPath(new URL('../data/booth-state.json', import.meta.url)), 'utf8'));
assert(Object.keys(original.missions).length >= 13);
await db.query('drop table if exists booth_meta, booth_missions');
await importDocumentToRows(db, original, { epoch: Number(backup.rows[0].epoch) });
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const disk = async () => (await loadRowsState(db)).state;
assert.equal(canonical(await disk()), canonical(original), 'Row import must match every field of every mission');
await assert.rejects(importDocumentToRows(db, original), /refusing to overwrite/);

const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let child;
async function start() {
  child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'pipe', env: { ...process.env, DATABASE_URL: url.href, DATABASE_SSL: 'disable', BOOTH_STORE_MODE: 'rows', NODE_ENV: 'test', PORT: String(port), SERVE_FRONTEND: 'false', ADMIN_PASSWORD: '' } });
  child.stderr.on('data', d => process.env.DEBUG_SERVER && process.stderr.write(d)); child.stdout.resume();
  for (let n = 0; n < 150; n++) {
    assert.equal(child.exitCode, null, 'Test backend exited');
    try { if ((await fetch(origin + '/api/health')).ok) return; } catch {}
    await sleep(50);
  }
  throw Error('Test backend did not start');
}
async function stop() { if (child?.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill('SIGKILL'); await done; } child = null; }
const create = id => fetch(origin + '/api/missions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: id }) });
const historyIntact = state => {
  for (const [id, record] of Object.entries(baseline.missions)) {
    assert(state.missions[id], `Missing historical mission ${id}`);
    assert.deepEqual({ ...state.missions[id], eventId: undefined }, { ...record, eventId: undefined });
  }
  for (const [id, record] of Object.entries(original.missions)) assert.equal(canonical(state.missions[id]), canonical(record), `Mission ${id} changed`);
};
let lock;
try {
  await start();
  historyIntact(await disk());
  const boardBefore = await (await fetch(origin + '/api/booth/leaderboard')).json();
  assert(boardBefore.entries.length > 0);

  lock = await db.connect(); await lock.query('BEGIN'); await lock.query('SELECT id FROM booth_meta WHERE id=1 FOR UPDATE');
  let answered = false;
  const waiting = create('CM-DURABLE').then(response => { answered = true; return response; });
  await sleep(300);
  assert.equal(answered, false, 'HTTP success must wait for PostgreSQL commit');
  assert.equal((await fetch(origin + '/api/missions/CM-DURABLE')).status, 404, 'Read endpoint exposed an uncommitted write');
  await lock.query('COMMIT'); lock.release(); lock = null;
  assert.equal((await waiting).status, 201);
  assert((await disk()).legacyMissions['CM-DURABLE']);

  const ids = Array.from({ length: 20 }, (_, n) => `CM-ROWS-${n}`);
  assert((await Promise.all(ids.map(create))).every(response => response.status === 201));
  const saved = await disk();
  assert(ids.every(id => saved.legacyMissions[id]));
  await Promise.all(ids.map(create));
  assert.deepEqual((await disk()).legacyMissions, saved.legacyMissions);
  await stop(); await start();
  assert.deepEqual((await disk()).legacyMissions, saved.legacyMissions);
  historyIntact(await disk());
  assert.deepEqual((await (await fetch(origin + '/api/booth/leaderboard')).json()).entries, boardBefore.entries);

  await db.query("CREATE FUNCTION reject_test_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected storage failure'; END $$");
  await db.query('CREATE TRIGGER reject_test_write BEFORE UPDATE ON booth_meta FOR EACH ROW EXECUTE FUNCTION reject_test_write()');
  assert.equal((await create('CM-FAIL')).status, 503);
  assert.equal((await (await fetch(origin + '/api/health')).json()).status, 'degraded');
  assert(!(await disk()).legacyMissions['CM-FAIL']);
  assert.equal((await fetch(origin + '/api/missions/CM-FAIL')).status, 404, 'Failed write left a phantom record in memory');
  await db.query('DROP TRIGGER reject_test_write ON booth_meta');
  await db.query('DROP FUNCTION reject_test_write()');
  assert.equal((await create('CM-RECOVER')).status, 201);
  assert.equal((await (await fetch(origin + '/api/health')).json()).status, 'ok');
  await stop(); await start();
  assert.equal((await fetch(origin + '/api/missions/CM-FAIL')).status, 404);
  assert.equal((await fetch(origin + '/api/missions/CM-RECOVER')).status, 200);
  await stop();

  const oldWriter = await openRowsStore(url.href), newWriter = await openRowsStore(url.href);
  try {
    await assert.rejects(oldWriter.saveChanges({ meta: { ...oldWriter.state, missions: undefined, sequence: 999999 }, upserts: [], deletes: [] }), /newer instance/);
    historyIntact(await disk());
    assert.notEqual((await disk()).sequence, 999999);
  } finally { await oldWriter.close(); await newWriter.close(); }
  console.log(`PostgreSQL ROWS PASS: ${Object.keys(original.missions).length}-mission backup imported field-for-field; re-import refused; commit-before-response; committed-only reads; 20 concurrent writes; duplicates; hard-kill recovery; write-failure 503 with degraded health and self-healing; old-writer fencing; all original missions unchanged.`);
} finally {
  if (lock) { await lock.query('ROLLBACK'); lock.release(); }
  await stop(); await db.end();
}
