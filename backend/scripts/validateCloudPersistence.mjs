import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPool, ensureTable, openCloudStore } from '../src/cloudStore.js';

// Destructive tests are restricted to a disposable local database, never Render.
const url = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
assert(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname.endsWith('_test'), 'Use a disposable localhost *_test database');
process.env.DATABASE_SSL = 'disable';
const db = createPool(url.href);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const backupFile = process.argv[2];
assert(backupFile, 'Supply the verified JSON backup to restore only into the disposable local database');
const backup = JSON.parse(readFileSync(backupFile, 'utf8'));
const original = backup.rows[0].state;
const baseline = JSON.parse(readFileSync(fileURLToPath(new URL('../data/booth-state.json', import.meta.url)), 'utf8'));
assert.equal(Object.keys(baseline.missions).length, 13);
assert(Object.keys(original.missions).length >= 13, 'Backup must include at least the 13 historical missions');
await ensureTable(db);
await db.query('TRUNCATE booth_store');
await db.query('INSERT INTO booth_store(id,epoch,state,updated_at) VALUES(1,$1,$2,$3)', [backup.rows[0].epoch, original, backup.rows[0].updated_at]);
const disk = async () => (await db.query('SELECT state FROM booth_store WHERE id=1')).rows[0].state;
assert.deepEqual(await disk(), original, 'Backup restore must match every mission field, not only scores');
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let child;
async function start() {
  child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'pipe', env: { ...process.env, DATABASE_URL: url.href, DATABASE_SSL: 'disable', NODE_ENV: 'test', PORT: String(port), SERVE_FRONTEND: 'false', ADMIN_PASSWORD: '' } });
  child.stderr.resume(); child.stdout.resume();
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
    const restored = state.missions[id];
    assert(restored, `Missing historical mission ${id}`);
    assert.deepEqual(restored.scoring, record.scoring);
    assert.equal(restored.mission.playerName, record.mission.playerName);
    assert.deepEqual({ ...restored, eventId: undefined }, { ...record, eventId: undefined });
  }
};
let lock;
try {
  await start();
  historyIntact(await disk());
  const boardBefore = await (await fetch(origin + '/api/booth/leaderboard')).json();
  assert(boardBefore.entries.length > 0);
  assert(boardBefore.entries.every(entry => entry.score <= 5000));

  // Hold the row lock: neither the response nor memory may publish an uncommitted write.
  lock = await db.connect(); await lock.query('BEGIN'); await lock.query('SELECT id FROM booth_store WHERE id=1 FOR UPDATE');
  let answered = false;
  const waiting = create('CM-DURABLE').then(response => { answered = true; return response; });
  await sleep(300);
  assert.equal(answered, false, 'HTTP success must wait for PostgreSQL commit');
  assert.equal((await fetch(origin + '/api/missions/CM-DURABLE')).status, 404, 'Read endpoint exposed an uncommitted write');
  await lock.query('COMMIT'); lock.release(); lock = null;
  assert.equal((await waiting).status, 201);
  assert((await disk()).legacyMissions['CM-DURABLE'], 'Acknowledged write must already be on disk');

  // Concurrent writes and duplicate requests must not replace one another.
  const ids = Array.from({ length: 20 }, (_, n) => `CM-CLOUD-${n}`);
  const responses = await Promise.all(ids.map(create));
  assert(responses.every(response => response.status === 201));
  const saved = await disk();
  assert(ids.every(id => saved.legacyMissions[id]));
  await Promise.all(ids.map(create));
  assert.deepEqual((await disk()).legacyMissions, saved.legacyMissions);
  // Kill immediately after acknowledgement (no graceful drain), then recover.
  await stop(); await start();
  assert.deepEqual((await disk()).legacyMissions, saved.legacyMissions);
  historyIntact(await disk());
  assert.deepEqual((await (await fetch(origin + '/api/booth/leaderboard')).json()).entries, boardBefore.entries);

  // Fail a real database write. No successful response and no phantom in-memory record.
  await db.query("CREATE FUNCTION reject_test_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected storage failure'; END $$");
  await db.query('CREATE TRIGGER reject_test_write BEFORE UPDATE OF state ON booth_store FOR EACH ROW EXECUTE FUNCTION reject_test_write()');
  assert.equal((await create('CM-FAIL')).status, 500);
  assert.equal((await fetch(origin + '/api/health')).status, 503);
  assert(!(await disk()).legacyMissions['CM-FAIL']);
  await stop();
  await db.query('DROP TRIGGER reject_test_write ON booth_store');
  await db.query('DROP FUNCTION reject_test_write()');
  await start(); assert.equal((await fetch(origin + '/api/missions/CM-FAIL')).status, 404);
  await stop();

  // Replacement server fences the old writer; it cannot overwrite the newer snapshot.
  const oldWriter = await openCloudStore(url.href), newWriter = await openCloudStore(url.href);
  try {
    await assert.rejects(oldWriter.save(JSON.stringify({ ...oldWriter.state, sequence: 999999 })), /newer instance/);
    await newWriter.save(JSON.stringify(newWriter.state));
    historyIntact(await disk());
  } finally { await oldWriter.close(); await newWriter.close(); }
  console.log(`PostgreSQL PASS: full ${Object.keys(original.missions).length}-mission backup restore; all 13 historical baseline records unchanged; commit-before-response; committed-only reads; 20 concurrent writes; duplicate requests; hard-kill recovery; persisted leaderboard; write-failure rejection; unhealthy health check; old-writer fencing.`);
} finally {
  if (lock) { await lock.query('ROLLBACK'); lock.release(); }
  await stop(); await db.end();
}
