import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

// Admin event deletion, tested ONLY against a disposable temporary store file (never real data).
const PASSWORD = 'correct-horse-battery-staple';
const SESSION_SECRET = 'cm-delete-validation-secret-0123456789';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'cyber-delete-')), file = join(dir, 'state.json');
const stations = finals => Object.fromEntries(finals.map((earned, i) => [`station0${i + 1}`, { earned, maximum: 1000, finalizedAt: `2026-10-11T0${i + 1}:00:00.000Z` }]));
const done = (missionId, eventId, name, finals) => ({ missionId, eventId, stage: 4, phase: 'COMPLETED', mission: { missionId, playerName: name, avatarId: 'cyber-03', status: 'complete', decisions: {} }, scoring: { maximum: 5000, total: finals.reduce((a, b) => a + b, 0), stations: stations(finals) } });
const ev = (id, name, status, extra = {}) => ({ id, name, date: '2026-10-11', sector: '', status, createdAt: '2026-10-11T00:00:00.000Z', activatedAt: '2026-10-11T00:00:00.000Z', archivedAt: null, hiddenMissionIds: [], ...extra });
const live = { missionId: 'CM-LIVE01', eventId: 'event-busy', stage: 2, phase: 'ACTIVE', timer: { activeMs: 0, activeStartedAt: new Date().toISOString() }, mission: { missionId: 'CM-LIVE01', playerName: 'Still Playing', status: 'active', decisions: {} } };
const seed = {
  sequence: 1, stations: {},
  events: { version: 1, legacyEventId: 'event-old1', activeEventId: 'event-active', items: {
    'event-old1': ev('event-old1', 'Old One / القديم', 'archived'), 'event-old2': ev('event-old2', 'Old Two', 'archived'),
    'event-busy': ev('event-busy', 'Busy Event', 'archived'), 'event-draft': ev('event-draft', 'Draft Event', 'draft'), 'event-active': ev('event-active', 'Active Event', 'active') } },
  missions: Object.fromEntries([done('CM-OLD101', 'event-old1', 'A', [700, 600]), { ...done('CM-OLD102', undefined, 'B', [500]), eventId: undefined }, done('CM-OLD201', 'event-old2', 'C', [900]), done('CM-ACT101', 'event-active', 'D', [800]), live].map(r => [r.missionId, r]))
};
delete seed.missions['CM-OLD102'].eventId;
const base = structuredClone(seed);
writeFileSync(file, JSON.stringify(seed));

const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r));
const origin = `http://127.0.0.1:${port}`; let child;
async function start() {
  const env = { ...process.env, PORT: String(port), NODE_ENV: 'test', ADMIN_PASSWORD: PASSWORD, ADMIN_SESSION_SECRET: SESSION_SECRET, BOOTH_STORE_FILE: file };
  delete env.DATABASE_URL;
  child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), env, stdio: 'pipe', windowsHide: true });
  let logs = ''; child.stderr.on('data', x => logs += x);
  for (let i = 0; i < 120; i++) { try { if ((await fetch(origin + '/api/health')).ok) return; } catch { /* starting */ } await sleep(50); }
  throw Error(logs || 'Server not ready');
}
const disk = () => JSON.parse(readFileSync(file, 'utf8'));
let cookie = '';
async function del(id, { body, status, headers = {}, auth = true, method = 'DELETE' } = {}) {
  const res = await fetch(`${origin}/api/admin/events/${id}`, { method, headers: { 'Content-Type': 'application/json', 'X-Cyber-Mission-Admin': '1', ...(auth && cookie ? { Cookie: cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (status !== undefined) assert.equal(res.status, status, `${id}: ${JSON.stringify(data)}`);
  return data;
}
const missionsOf = state => Object.keys(state.missions).sort();

try {
  await start();

  // Unauthenticated, wrong header and cross-origin requests change nothing.
  await del('event-old2', { auth: false, body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 401 });
  const login = await fetch(origin + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Cyber-Mission-Admin': '1' }, body: JSON.stringify({ password: PASSWORD }) });
  assert.equal(login.status, 200); cookie = login.headers.get('set-cookie').split(';')[0];
  await del('event-old2', { headers: { 'X-Cyber-Mission-Admin': '0' }, body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 403 });
  await del('event-old2', { headers: { Origin: 'http://evil.example' }, body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 403 });
  await del('event-old2', { auth: false, headers: { 'X-Cyber-Mission-Admin': '0' }, body: {}, status: 403 });
  assert.deepEqual(disk().missions, base.missions); assert.deepEqual(Object.keys(disk().events.items), Object.keys(base.events.items));

  // Safe rejections: wrong/missing name, wrong count, active, draft, in-progress, unknown.
  await del('event-old2', { body: { confirmName: 'old two', expectedParticipants: 1 }, status: 400 });
  await del('event-old2', { body: { expectedParticipants: 1 }, status: 400 });
  await del('event-old2', { status: 400 });
  await del('event-old2', { body: { confirmName: 'Old Two', expectedParticipants: 2 }, status: 409 });
  await del('event-old2', { body: { confirmName: 'Old Two' }, status: 409 });
  await del('event-active', { body: { confirmName: 'Active Event', expectedParticipants: 1 }, status: 409 });
  await del('event-draft', { body: { confirmName: 'Draft Event', expectedParticipants: 0 }, status: 409 });
  await del('event-busy', { body: { confirmName: 'Busy Event', expectedParticipants: 0 }, status: 409 });
  await del('event-missing', { body: { confirmName: 'x', expectedParticipants: 0 }, status: 404 });
  await del('..%2Fevent-old2', { body: {}, status: 404 });
  await del('event-old2', { method: 'POST', body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 404 });
  assert.deepEqual(disk(), base, 'a rejected request modified the store');

  // Authorized, confirmed deletion removes exactly one event and its own missions.
  const result = await del('event-old2', { body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 200 });
  assert.deepEqual(result, { deleted: true, eventId: 'event-old2', missionsRemoved: 1 });
  let state = disk();
  assert.equal(state.events.items['event-old2'], undefined);
  assert.equal(state.missions['CM-OLD201'], undefined);
  assert.deepEqual(missionsOf(state), ['CM-ACT101', 'CM-LIVE01', 'CM-OLD101', 'CM-OLD102']);
  for (const id of missionsOf(state)) assert.deepEqual(state.missions[id], base.missions[id], `${id} changed`);
  for (const id of ['event-old1', 'event-busy', 'event-draft', 'event-active']) assert.deepEqual(state.events.items[id], base.events.items[id], `${id} changed`);
  assert.equal(state.events.activeEventId, 'event-active');

  // Repeating the request is a harmless 404.
  await del('event-old2', { body: { confirmName: 'Old Two', expectedParticipants: 1 }, status: 404 });
  assert.deepEqual(disk(), state);

  // Public lists no longer show it; others remain; a legacy-event mission without eventId is counted with it.
  const publicEvents = await (await fetch(origin + '/api/booth/events')).json();
  assert.deepEqual(publicEvents.previous.map(e => e.id).sort(), ['event-busy', 'event-old1']);
  assert.equal((await fetch(origin + '/api/booth/events/event-old2/leaderboard')).status, 404);
  const legacy = await del('event-old1', { body: { confirmName: 'Old One / القديم', expectedParticipants: 2 }, status: 200 });
  assert.equal(legacy.missionsRemoved, 2);
  state = disk();
  assert.deepEqual(missionsOf(state), ['CM-ACT101', 'CM-LIVE01']);
  assert.deepEqual(state.missions['CM-ACT101'], base.missions['CM-ACT101']);
  assert.deepEqual(state.missions['CM-LIVE01'], base.missions['CM-LIVE01']);
  assert.equal((await (await fetch(origin + '/api/booth/leaderboard')).json()).entries.length, 1);

  // Restart: the deletion is durable and nothing else changed.
  child.kill(); await once(child, 'exit'); await start();
  assert.deepEqual(disk().missions, state.missions);
  console.log('Event deletion PASS: auth/CSRF/origin guards, typed-name and count checks, active/draft/in-progress protection, exactly-one-event scope, idempotent repeat, restart durability (disposable store only).');
} finally {
  if (child?.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
  rmSync(dir, { recursive: true, force: true });
}
