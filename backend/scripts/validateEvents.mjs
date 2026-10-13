import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { createPool, ensureTable } from '../src/cloudStore.js';

// Event management end-to-end test. File store by default; set TEST_DATABASE_URL to run the
// same flow against a throwaway Postgres (never point it at real data: it seeds row id=1).
const DATABASE = process.env.TEST_DATABASE_URL;
if (DATABASE) {
  const target = new URL(DATABASE);
  assert(['127.0.0.1', 'localhost'].includes(target.hostname) && target.pathname.endsWith('_test'), 'PostgreSQL tests require a disposable localhost *_test database');
}
const PASSWORD = 'correct-horse-battery-staple';
const SESSION_SECRET = 'cm-events-validation-secret-0123456789';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'cyber-events-')), file = join(dir, 'state.json');
const stations = finals => Object.fromEntries(finals.map((earned, i) => [`station0${i + 1}`, { earned, maximum: i < 2 ? 1000 : 1500, finalizedAt: `2026-10-11T0${i + 1}:00:00.000Z` }]));
const past = (missionId, playerName, finals) => ({ missionId, stage: 4, phase: 'COMPLETED', mission: { missionId, playerName, avatarId: 'cyber-03', status: 'complete', decisions: {} }, scoring: { maximum: 5000, total: finals.reduce((a, b) => a + b, 0), stations: stations(finals) } });
const historical = Object.fromEntries([past('CM-HIST01', 'Strategy One', [700, 600, 600, 800]), past('CM-HIST02', 'Strategy Two', [900, 900, 1000, 1200]), past('CM-HIDD01', 'Hidden Test', [500])].map(r => [r.missionId, r]));
const seed = { sequence: 7, stations: {}, missions: structuredClone(historical), leaderboardEvent: { eventId: 'event-20261011-100853', resetAt: '2026-10-11T07:08:53.000Z', excludedMissionIds: ['CM-HIDD01'] } };

let pool;
async function reseed() {
  if (!DATABASE) return writeFileSync(file, JSON.stringify(seed));
  pool = createPool(DATABASE); await ensureTable(pool);
  await pool.query('delete from booth_store where id = 1');
  await pool.query('insert into booth_store(id, epoch, state) values (1, 0, $1::jsonb)', [JSON.stringify(seed)]);
}
async function disk() {
  if (!DATABASE) return JSON.parse(readFileSync(file, 'utf8'));
  await sleep(400);
  return (await pool.query('select state from booth_store where id = 1')).rows[0].state;
}
async function writeDisk(state) {
  if (!DATABASE) return writeFileSync(file, JSON.stringify(state));
  await pool.query('update booth_store set state = $1::jsonb where id = 1', [JSON.stringify(state)]);
}

const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r));
const origin = `http://127.0.0.1:${port}`; let child;
async function start(extra = {}) {
  const env = { ...process.env, PORT: String(port), NODE_ENV: 'test', ADMIN_PASSWORD: PASSWORD, ADMIN_SESSION_SECRET: SESSION_SECRET, ...extra };
  if (DATABASE) env.DATABASE_URL = DATABASE; else { delete env.DATABASE_URL; env.BOOTH_STORE_FILE = file; }
  child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), env, stdio: 'pipe', windowsHide: true });
  let logs = ''; child.stderr.on('data', x => logs += x);
  for (let i = 0; i < 120; i++) { try { if ((await fetch(origin + '/api/health')).ok) return; } catch { /* starting */ } await sleep(50); }
  throw Error(logs || 'Server not ready');
}
async function stop() { if (child?.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; await sleep(DATABASE ? 600 : 0); } }

let cookie = '';
async function admin(path, { method = 'GET', body, status, headers = {}, auth = true } = {}) {
  const res = await fetch(origin + '/api/admin' + path, { method, headers: { 'Content-Type': 'application/json', ...(method !== 'GET' ? { 'X-Cyber-Mission-Admin': '1' } : {}), ...(auth && cookie ? { Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (status !== undefined) assert.equal(res.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  return { res, data };
}
const board = async () => (await (await fetch(origin + '/api/booth/leaderboard')).json()).entries;
const players = (tag, n) => Array.from({ length: n }, (_, i) => ({ id: `CM-${tag}${String(i).padStart(2, '0')}`, token: String(i + 1).repeat(64), rev: 0, stage: 1, startedAt: new Date().toISOString() }));
async function solo(p, action, body = {}, status = 200) {
  const res = await fetch(`${origin}/api/booth/independent/${p.id}/${p.stage}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: p.id, accessToken: p.token, revision: p.rev, ...body }) });
  const data = await res.json(); assert.equal(res.status, status, JSON.stringify(data));
  if (res.ok) { p.rev = data.revision; p.stage = data.mission.currentStation; p.mission = data.mission; } return data;
}
const missionBody = (p, name) => ({ missionId: p.id, playerName: name, language: 'en', startedAt: p.startedAt, status: 'active', currentStation: 1, completedStations: [], decisions: { station01: { scenarioId: 'SMS-PHISH-001', senderInspected: true, messageDetailsViewed: true, linkInspected: true, completedAt: null } }, evidence: [], flags: {} });
const begin = (list, label) => Promise.all(list.map((p, i) => solo(p, 'sync', { mission: missionBody(p, `${label} ${i}`) })));
const finishStation1 = list => Promise.all(list.map(async p => { const mission = structuredClone(p.mission); Object.assign(mission.decisions.station01, { finalAction: 'report', completedAt: new Date().toISOString() }); mission.completedStations = [1]; await solo(p, 'sync', { mission }); assert.equal(p.stage, 2); }));

try {
  await reseed(); await start();

  // 1. Migration of the existing records
  let state = await disk();
  const legacyId = 'event-20261011-100853';
  assert.equal(state.events.activeEventId, legacyId);
  assert.equal(Object.keys(state.events.items).length, 1);
  assert.deepEqual(state.events.items[legacyId].hiddenMissionIds, ['CM-HIDD01']);
  assert.match(state.events.items[legacyId].name, /Strategy Day/);
  for (const [id, record] of Object.entries(historical)) assert.deepEqual({ ...state.missions[id], eventId: undefined }, { ...record, eventId: undefined }, 'migration changed a record');
  assert(Object.values(state.missions).every(r => r.eventId === legacyId));
  assert.deepEqual((await board()).map(e => e.missionId), ['CM-HIST02', 'CM-HIST01']);

  // 2. Authentication and request protection
  await admin('/events', { status: 401, auth: false });
  await admin('/session', { status: 200 });
  assert.equal((await admin('/session')).data.authenticated, false);
  await admin('/login', { method: 'POST', body: { password: 'wrong-password' }, status: 401 });
  await admin('/login', { method: 'POST', status: 401 });
  const login = await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 });
  const setCookie = login.res.headers.getSetCookie()[0];
  assert(/HttpOnly/.test(setCookie) && /SameSite=Strict/.test(setCookie) && /Path=\/api\/admin/.test(setCookie));
  assert(!JSON.stringify(login.data).includes(PASSWORD));
  cookie = setCookie.split(';')[0];
  await admin('/events', { method: 'POST', body: { name: 'X', date: '2026-11-01' }, status: 403, headers: { 'X-Cyber-Mission-Admin': '' } });
  await admin('/events', { method: 'POST', body: { name: 'X', date: '2026-11-01' }, status: 403, headers: { Origin: 'https://evil.example' } });
  await admin('/events', { status: 401, headers: { Cookie: cookie.slice(0, -3) + 'abc' }, auth: false });
  assert.equal((await admin('/session')).data.authenticated, true);
  assert((await admin('/events', { status: 200 })).data.events[0].active);

  // 3. Create is separate from activate and validates input
  await admin('/events', { method: 'POST', body: { name: '', date: '2026-11-01' }, status: 400 });
  await admin('/events', { method: 'POST', body: { name: 'Bad', date: '2026-02-31' }, status: 400 });
  await admin('/events', { method: 'POST', body: { name: 'N'.repeat(81), date: '2026-11-01' }, status: 400 });
  const created = (await admin('/events', { method: 'POST', body: { name: 'Banking Sector', date: '2026-11-01', sector: 'Banking' }, status: 200 })).data;
  assert.equal(created.status, 'draft'); assert.equal(created.participants, 0);
  await admin('/events', { method: 'POST', body: { name: 'banking sector', date: '2026-11-01' }, status: 409 });
  const second = (await admin('/events', { method: 'POST', body: { name: 'Throwaway', date: '2026-11-02' }, status: 200 })).data;
  assert.equal((await admin('/events')).data.activeEventId, legacyId);
  assert.equal((await board()).length, 2, 'creating an event must not change the leaderboard');
  assert.equal(((await admin('/events')).data.events.find(e => e.id === legacyId)).participants, 2);

  // 4. Players in progress block switching
  const oldPlayers = players('OLDP', 4);
  await begin(oldPlayers, 'Old event');
  const blocked = await admin(`/events/${created.id}/activate`, { method: 'POST', status: 409 });
  assert.equal(blocked.data.blockers.length, 4);
  await finishStation1(oldPlayers);
  const beforeRetry = await disk();
  await Promise.all(oldPlayers.map(p => solo({ ...p, stage: 1 }, 'sync', { mission: structuredClone(p.mission) })));
  const afterRetry = await disk();
  for (const p of oldPlayers) assert.deepEqual(afterRetry.missions[p.id].scoring, beforeRetry.missions[p.id].scoring, 'duplicate completion must not award points again');
  await admin(`/events/${created.id}/activate`, { method: 'POST', status: 409 });
  assert.equal((await board()).length, 6);
  state = await disk();
  assert(oldPlayers.every(p => state.missions[p.id].eventId === legacyId));
  assert.equal((await admin('/events')).data.activeEventId, legacyId);

  // 5. Finish the old players (persisted), restart, then activate
  await stop();
  state = await disk();
  for (const p of oldPlayers) { state.missions[p.id].phase = 'TIMED_OUT'; state.missions[p.id].mission.status = 'timed-out'; }
  await writeDisk(state); await start();
  await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 });
  cookie = (await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 })).res.headers.getSetCookie()[0].split(';')[0];
  const before = await disk();
  const activated = await admin(`/events/${created.id}/activate`, { method: 'POST', status: 200 });
  assert.equal(activated.data.activeEventId, created.id); assert.equal(activated.data.previousEventId, legacyId);
  assert.deepEqual(await board(), [], 'new event must start with zero participants');
  await admin(`/events/${created.id}/activate`, { method: 'POST', status: 409 });
  await admin('/events/__proto__/activate', { method: 'POST', status: 404 });
  await admin('/events/event-missing/activate', { method: 'POST', status: 404 });
  const after = await disk();
  assert.deepEqual(after.missions, before.missions, 'activation must not touch any mission');
  assert.equal(after.events.items[legacyId].status, 'archived'); assert(after.events.items[legacyId].archivedAt);
  assert.equal(after.events.items[created.id].status, 'active');

  // 6. Historical event stays viewable; hidden missions are flagged but not ranked
  const history = (await admin(`/events/${legacyId}/leaderboard`, { status: 200 })).data;
  assert.equal(history.entries.length, 6); assert.deepEqual(history.hidden.map(h => [h.missionId, h.hidden]), [['CM-HIDD01', true]]);
  assert(!history.entries.some(e => e.missionId === 'CM-HIDD01'));
  assert.deepEqual(history.entries.slice(0, 2).map(e => e.playerName), ['Strategy Two', 'Strategy One']);

  // 7. Concurrent players join only the new event
  const newPlayers = players('NEWP', 4);
  await begin(newPlayers, 'New event'); await sleep(1100); await finishStation1(newPlayers);
  const live = await board();
  assert.equal(live.length, 4); assert(live.every(e => e.playerName.startsWith('New event')));
  state = await disk();
  assert(newPlayers.every(p => state.missions[p.id].eventId === created.id));
  assert.equal((await admin(`/events/${legacyId}/leaderboard`)).data.entries.length, 6, 'old event must not receive new players');
  assert.equal((await admin('/events')).data.events.find(e => e.id === created.id).participants, 4);

  // 8. Station mode (shared booth) missions are stamped with the active event too
  const station = await fetch(`${origin}/api/booth/stations/1/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: 'device-station-1', revision: 0, mission: missionBody({ id: 'CM-STAT01', startedAt: new Date().toISOString() }, 'Station mode') }) });
  assert.equal(station.status, 200, await station.clone().text());
  assert.equal((await disk()).missions['CM-STAT01'].eventId, created.id);
  await admin(`/events/${legacyId}/activate`, { method: 'POST', status: 409 });

  // 9. Archiving
  await admin(`/events/${second.id}/archive`, { method: 'POST', status: 200 });
  await admin(`/events/${second.id}/archive`, { method: 'POST', status: 409 });
  await admin(`/events/${created.id}/archive`, { method: 'POST', status: 409 });
  assert.equal((await admin('/events')).data.events.find(e => e.id === second.id).status, 'archived');

  // 10. Persistence across restart; nothing lost
  const snapshot = await disk(); await stop(); await start();
  cookie = (await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 })).res.headers.getSetCookie()[0].split(';')[0];
  const listed = (await admin('/events', { status: 200 })).data;
  assert.equal(listed.activeEventId, created.id);
  assert.deepEqual((await board()).map(e => e.missionId).sort(), newPlayers.map(p => p.id).sort());
  const restarted = await disk();
  for (const id of Object.keys(historical)) assert.deepEqual({ ...restarted.missions[id], eventId: 0 }, { ...historical[id], eventId: 0 });
  assert.equal(Object.keys(restarted.missions).length, Object.keys(snapshot.missions).length);
  assert.equal((await admin(`/events/${legacyId}/leaderboard`)).data.entries.length, 6);
  await admin('/logout', { method: 'POST', status: 200 });

  // 10b. One-step "Start Competition" used by the leaderboard (+) button, and the public read-only views
  await admin('/start', { method: 'POST', body: { name: 'Healthcare Sector' }, status: 401, auth: false });
  await admin('/start', { method: 'POST', body: { name: 'Healthcare Sector' }, status: 403, headers: { 'X-Cyber-Mission-Admin': '' } });
  cookie = (await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 })).res.headers.getSetCookie()[0].split(';')[0];
  const refused = await admin('/start', { method: 'POST', body: { name: 'Healthcare Sector' }, status: 409 });
  assert(refused.data.blockers.length > 0);
  assert.equal(Object.keys((await disk()).events.items).length, Object.keys(restarted.events.items).length, 'a refused start must not leave a stray event');
  await stop(); state = await disk();
  for (const r of Object.values(state.missions)) if (r.eventId === created.id) { r.phase = 'TIMED_OUT'; r.mission.status = 'timed-out'; }
  state.stations = {}; await writeDisk(state); await start();
  cookie = (await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 200 })).res.headers.getSetCookie()[0].split(';')[0];
  await admin('/start', { method: 'POST', body: { name: '  ' }, status: 400 });
  const started = (await admin('/start', { method: 'POST', body: { name: 'Healthcare Sector' }, status: 200 })).data;
  assert.equal(started.status, 'active'); assert.equal(started.participants, 0);
  await admin('/start', { method: 'POST', body: { name: 'Healthcare Sector' }, status: 409 });
  assert.deepEqual(await board(), []);
  const pub = await (await fetch(origin + '/api/booth/events')).json();
  assert.equal(pub.active.name, 'Healthcare Sector'); assert.equal(pub.active.participants, 0);
  assert.deepEqual(pub.previous.map(p => p.name).sort(), ['Banking Sector', 'Strategy Day / يوم الاستراتيجية', 'Throwaway'].sort());
  assert.equal((await (await fetch(origin + '/api/booth/leaderboard')).json()).event.id, started.id);
  const bank = await (await fetch(`${origin}/api/booth/events/${created.id}/leaderboard`)).json();
  assert.equal(bank.entries.length, 4); assert.deepEqual(Object.keys(bank.event).sort(), ['date', 'id', 'name']);
  const old = await (await fetch(`${origin}/api/booth/events/${legacyId}/leaderboard`)).json();
  assert.equal(old.entries.length, 6); assert(!JSON.stringify(old).includes('CM-HIDD01'), 'hidden missions must stay out of public views');
  const draft = (await admin('/events', { method: 'POST', body: { name: 'Draft Only', date: '2026-12-01' }, status: 200 })).data;
  assert.equal((await fetch(`${origin}/api/booth/events/${draft.id}/leaderboard`)).status, 404);
  assert(!(await (await fetch(origin + '/api/booth/events')).json()).previous.some(p => p.id === draft.id));
  const joiners = players('HLTH', 4); await begin(joiners, 'Health'); await sleep(1100); await finishStation1(joiners);
  assert.equal((await board()).length, 4);
  assert.deepEqual((await board()).map(p=>p.missionId).sort(),joiners.map(p=>p.id).sort(),'current leaderboard must include only its own event');
  const archivedBank=(await (await fetch(`${origin}/api/booth/events/${created.id}/leaderboard`)).json()).entries;
  assert.deepEqual(archivedBank.map(p=>p.missionId).sort(),newPlayers.map(p=>p.id).sort(),'history must include only the selected event');
  assert(!archivedBank.some(p=>joiners.some(j=>j.id===p.missionId)));
  state = await disk(); assert(joiners.every(p => state.missions[p.id].eventId === started.id));
  assert.equal((await (await fetch(`${origin}/api/booth/events/${created.id}/leaderboard`)).json()).entries.length, 4, 'previous results must be unchanged');
  await admin('/logout', { method: 'POST', status: 200 });
  // 11. Brute-force lockout (last: it locks this test client's address)
  cookie = '';
  for (let i = 0; i < 5; i++) await admin('/login', { method: 'POST', body: { password: 'nope-nope-nope' + i }, status: 401 });
  await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 429 });

  // 12. Admin stays disabled without strong credentials; public-mode allow-list and cookie flags
  await stop(); await start({ ADMIN_PASSWORD: 'short' });
  await admin('/login', { method: 'POST', body: { password: 'short' }, status: 503 });
  await admin('/events', { status: 401 });
  await stop(); await start({ ADMIN_SESSION_SECRET: 'short-secret' });
  await admin('/login', { method: 'POST', body: { password: PASSWORD }, status: 503 });
  await admin('/events', { status: 401 });
  await stop(); await start({ SERVE_FRONTEND: 'true' });
  await admin('/events', { status: 401 });
  await admin('/unknown', { status: 404 }); assert.equal((await fetch(origin + '/api/booth/events')).status, 200); assert.equal((await fetch(origin + '/api/booth/events/x/y')).status, 404); await admin('/events/x/delete', { method: 'POST', status: 404 }); await admin('/events/x', { method: 'DELETE', status: 401 });
  const secureLogin = await admin('/login', { method: 'POST', body: { password: PASSWORD }, headers: { 'X-Forwarded-Proto': 'https' } });
  assert.equal(secureLogin.res.status, 200); assert(/;\s*Secure/.test(secureLogin.res.headers.getSetCookie()[0]));
  assert.equal((await fetch(origin + '/api/missions/CM-HIST01')).status, 404);
  console.log(`PASS (${DATABASE ? 'postgres' : 'file store'}): migration preserved records; admin auth, CSRF and lockout; createâ‰ activate; in-progress guard; zero-start leaderboard; archived history with hidden missions; concurrent players isolated per event; station-mode stamping; restart persistence.`);
} finally { await stop(); await pool?.end(); }
