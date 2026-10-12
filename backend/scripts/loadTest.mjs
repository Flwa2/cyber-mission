// Load / fault-injection harness. Runs ONLY against a disposable localhost *_test PostgreSQL database
// and a locally spawned server; refuses anything else. Never touches production.
//   TEST_DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:PORT/NAME_test node scripts/loadTest.mjs <seed-backup.json>
// Options (env): PLAYERS=10 CLIENT=legacy|resilient FAULTS=none|net|restart|all STORE=doc|rows POLL_MS=800
//   THINK_MS=250 LEADERBOARDS=2 TARGET_MISSIONS=48 REPORT=path.json
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { requestJson, nextPollDelay } from '../../frontend/src/booth/http.js';

const url = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
assert(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname.endsWith('_test'), 'Use a disposable localhost *_test database');
const cfg = {
  players: Number(process.env.PLAYERS || 10), client: process.env.CLIENT || 'resilient', faults: process.env.FAULTS || 'none',
  store: process.env.STORE || 'doc', pollMs: Number(process.env.POLL_MS || 800), thinkMs: Number(process.env.THINK_MS || 250),
  boards: Number(process.env.LEADERBOARDS ?? 2), target: Number(process.env.TARGET_MISSIONS || 48), stagger: Number(process.env.STAGGER_MS || 1500)
};
const seedFile = process.argv[2]; assert(seedFile, 'Supply a backup file used only to seed the disposable database');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const db = new pg.Pool({ connectionString: url.href, max: 3, ssl: false });

// ---- seed: real historical records first, then synthetic clones up to production-like volume
const seed = JSON.parse(readFileSync(seedFile, 'utf8')).rows[0].state;
const ids = Object.keys(seed.missions); const baseCount = ids.length;
for (let i = 0; Object.keys(seed.missions).length < cfg.target; i++) {
  const source = structuredClone(seed.missions[ids[i % baseCount]]);
  const id = 'CM-' + randomBytes(4).toString('hex').toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 6);
  source.missionId = id; if (source.mission) source.mission.missionId = id; seed.missions[id] = source;
}
const seedIds = Object.keys(seed.missions);
const seedFrozen = JSON.stringify(seed.missions);
await db.query('create table if not exists booth_store(id int primary key, epoch bigint not null default 0, state jsonb not null, updated_at timestamptz not null default now())');
await db.query('truncate booth_store');
await db.query('drop table if exists booth_missions, booth_meta');
await db.query('insert into booth_store(id,epoch,state) values(1,0,$1)', [JSON.stringify(seed)]);
if (cfg.store === 'rows') await (await import('../src/rowsStore.js')).importDocumentToRows(db, seed);
const seedBytes = JSON.stringify(seed).length;

const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); const port = probe.address().port; await new Promise(r => probe.close(r));
const origin = `http://127.0.0.1:${port}`;
let child, serverLogs = '', restarts = 0, killedAt = [];
async function start() {
  child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'pipe',
    env: { ...process.env, PORT: String(port), DATABASE_URL: url.href, DATABASE_SSL: 'disable', NODE_ENV: 'test', BOOTH_STORE_MODE: cfg.store === 'rows' ? 'rows' : '', TELEMETRY_LOG_MS: '5000' } });
  child.stdout.on('data', x => serverLogs += x); child.stderr.on('data', x => serverLogs += x);
  for (let i = 0; i < 200; i++) { try { if ((await fetch(origin + '/api/health')).ok) return; } catch { } await sleep(50); }
  throw new Error('Server not ready: ' + serverLogs.slice(-500));
}
const samples = []; let cpuStart = null, sampling = true;
const sampleOnce = () => { const pid = child?.pid; return !pid || child.exitCode !== null ? Promise.resolve(null) : new Promise(res => execFile('powershell', ['-NoProfile', '-Command', `$p=Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if($p){"$($p.WorkingSet64) $($p.TotalProcessorTime.TotalMilliseconds)"}`], (e, out) => { const [rss, cpu] = String(out).trim().split(' ').map(Number); res(rss ? { t: Date.now(), rss, cpu, pid } : null); })); };
const sampler = (async () => { while (sampling) { const s = await sampleOnce(); if (s) { cpuStart ??= s; samples.push(s); } await sleep(1500); } })();

// ---- instrumented, optionally faulty transport
const lat = {}; const errors = {}; let requests = 0, injected = { dropBefore: 0, dropAfter: 0, html502: 0 };
const record = (key, ms) => (lat[key] ||= []).push(ms);
const err = (code) => errors[code] = (errors[code] || 0) + 1;
const faulty = cfg.faults === 'net' || cfg.faults === 'all';
const transport = async (u, init) => {
  if (faulty) {
    await sleep(rnd(80, 700));
    const roll = Math.random();
    if (roll < 0.02) { injected.dropBefore++; throw new TypeError('fetch failed'); }
    if (roll < 0.03) { injected.html502++; return new Response('<html><body><h1>502 Bad Gateway</h1></body></html>', { status: 502, headers: { 'content-type': 'text/html' } }); }
    const response = await fetch(u, init);
    if (roll < 0.05) { await response.text().catch(() => { }); injected.dropAfter++; throw new TypeError('fetch failed'); }
    await sleep(rnd(50, 400));
    return response;
  }
  return fetch(u, init);
};
async function http(u, init, key, retries) {
  const t = performance.now(); requests++;
  try {
    let data;
    if (cfg.client === 'legacy') {
      const res = await transport(u, { ...init, signal: AbortSignal.timeout(8000) });
      try { data = await res.json(); } catch { const e = new Error('Unexpected token < in JSON'); e.code = 'JSON_PARSE'; throw e; }
      if (!res.ok) { const e = new Error(data.error || 'failed'); e.status = res.status; e.conflict = data.conflict; e.code = 'HTTP_' + res.status; throw e; }
    } else data = await requestJson(u, init, { timeoutMs: 6000, retries, fetchImpl: transport });
    record(key, performance.now() - t); return data;
  } catch (e) { record(key + ':error', performance.now() - t); err(`${key}:${e.code || e.name}`); throw e; }
}

// ---- players
const oracle = async id => cfg.store === 'rows'
  ? (await db.query('select doc from booth_missions where mission_id=$1', [id])).rows[0]?.doc
  : (await db.query("select state #> array['missions',$1::text] as doc from booth_store where id=1", [id])).rows[0]?.doc;
const players = Array.from({ length: cfg.players }, (_, i) => ({ i, id: 'CM-' + (0x100000 + i * 7919 + 0x2000).toString(36).toUpperCase().padStart(6, 'L').slice(-6), token: randomBytes(32).toString('hex'), rev: 0, stage: 1, userRetries: 0, done: false, failed: null, wrongProgress: 0 }));
const expectedTotal = p => p.i % 5 === 1 ? 4600 : 5000;
async function call(p, action, body = {}, station = p.stage, key = action, retries = 2) {
  const data = await http(`${origin}/api/booth/independent/${p.id}/${station}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision: p.rev, ...body, missionId: p.id, accessToken: p.token }) }, `${key}`, action === 'poll' ? 0 : retries);
  absorb(p, data); return data;
}
const absorb = (p, data) => { const m = data.mission ?? data.conflict?.mission; const rev = data.revision ?? data.conflict?.revision; if (Number.isInteger(rev)) p.rev = Math.max(p.rev, rev); if (m?.currentStation > p.stage) p.stage = m.currentStation; if (m) p.mission = m; };
async function refresh(p) { for (let n = 0; n < 6; n++) { try { await call(p, 'poll', {}, p.stage, 'poll'); return; } catch (e) { if (e.conflict) { absorb(p, e); return; } await sleep(rnd(500, 1200)); } } }
// A user retries after an error; the server oracle decides whether the lost request had actually committed.
async function perform(p, action, body, applied, station = p.stage, key = 'station' + station + ':' + action) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const before = p.rev;
    try { await call(p, action, body, station, key); return; }
    catch (e) {
      if (e.conflict) absorb(p, e);
      if (attempt) p.userRetries++;
      await sleep(rnd(300, 900)); await refresh(p);
      const rec = await oracle(p.id).catch(() => null);
      if (rec && applied(rec, before)) return;
    }
  }
  throw new Error(`${p.id} stuck on ${key}`);
}
const think = () => sleep(rnd(cfg.thinkMs * 0.6, cfg.thinkMs * 1.6));
const advanced = n => rec => rec && rec.stage >= n;
const bumped = (rec, before) => (rec?.revision || 0) > before;
const OBJECTS = ['usb', 'badge', 'documents', 'cable', 'qr', 'power'];
async function journey(p) {
  await sleep(rnd(0, cfg.stagger));
  const mission = { missionId: p.id, playerName: `Load ${p.i}`, language: p.i % 2 ? 'ar' : 'en', startedAt: new Date().toISOString(), status: 'active', currentStation: 1, completedStations: [], decisions: { station01: { scenarioId: 'SMS-PHISH-001', senderInspected: true, messageDetailsViewed: true, linkInspected: true, completedAt: null } }, evidence: [], flags: {} };
  p.stage = 1; p.started = performance.now();
  await perform(p, 'sync', { mission }, rec => !!rec, 1, 'station1:start');
  await sleep(1200 + rnd(0, cfg.thinkMs));
  const finished = structuredClone(mission); Object.assign(finished.decisions.station01, { finalAction: 'report', linkOpened: p.i % 5 === 1, completedAt: new Date().toISOString() }); finished.completedStations = [1];
  await perform(p, 'sync', { mission: finished }, advanced(2), 1, 'station1:complete'); p.stage = Math.max(p.stage, 2);
  for (const objectId of OBJECTS) { await think(); await perform(p, 'desk', { objectId, actionId: 'report' }, bumped, 2); }
  await think(); await perform(p, 'desk', { complete: true }, advanced(3), 2, 'station2:complete'); p.stage = Math.max(p.stage, 3);
  const rec3 = await oracle(p.id);
  for (const row of rec3.station03Experience.rows.filter(x => x.isIncidentRelevant)) { await think(); await perform(p, 'investigation', { action: 'inspect', itemId: row.id }, bumped, 3); await perform(p, 'investigation', { action: 'add', itemId: row.id }, bumped, 3); }
  await perform(p, 'investigation', { action: 'begin-classification' }, bumped, 3);
  for (const q of rec3.station03Experience.dataChallenge.questions) { await think(); await perform(p, 'investigation', { action: 'answer', itemId: q.id, selectedClassification: q.expectedAnswer }, bumped, 3); }
  await perform(p, 'investigation', { action: 'complete' }, advanced(4), 3, 'station3:complete'); p.stage = Math.max(p.stage, 4);
  const rec4 = await oracle(p.id);
  await think(); await perform(p, 'resolution', { action: 'vault-attempt', code: rec4.vaultAssignment.code, requestId: `${p.id}-unlock` }, bumped, 4);
  await think(); await perform(p, 'resolution', { action: 'vault-continue', requestId: `${p.id}-continue` }, bumped, 4);
  await think(); await perform(p, 'resolution', { action: 'select-response', phase: 'person', selection: rec4.mission.narrativeAssignment.associatedPersonId }, bumped, 4);
  await think(); await perform(p, 'resolution', { action: 'advance-response' }, rec => rec.phase === 'COMPLETED', 4, 'station4:submit');
  p.elapsedMs = performance.now() - p.started; p.done = true;
}
let stopPolling = false;
const pollLoop = async p => { let fails = 0; while (!stopPolling && !p.done) { try { if (p.mission) await call(p, 'poll', {}, p.stage, 'poll'); fails = 0; } catch (e) { if (e.conflict) { absorb(p, e); fails = 0; } else fails++; } await sleep(cfg.client === 'legacy' ? cfg.pollMs : nextPollDelay(cfg.pollMs, fails)); } };
const boardLoop = async () => { while (!stopPolling) { try { await http(origin + '/api/booth/leaderboard', { cache: 'no-store' }, 'leaderboard', 0); } catch { } await sleep(1500); } };

const t0 = performance.now();
await start();
const startSample = (await sampleOnce()) || samples[0];
const boards = Array.from({ length: cfg.boards }, boardLoop);
const killer = (cfg.faults === 'restart' || cfg.faults === 'all') ? (async () => {
  while (players.filter(p => p.stage >= 3).length < Math.ceil(cfg.players / 2)) await sleep(300);
  killedAt.push(Math.round(performance.now() - t0)); child.kill('SIGKILL'); await once(child, 'exit'); await sleep(4000); await start(); restarts++;
})() : Promise.resolve();
await Promise.all(players.map(async p => { p.poll = pollLoop(p); try { await journey(p); } catch (e) { p.failed = e.message; } }));
await killer; stopPolling = true; await Promise.all(players.map(p => p.poll)); await Promise.allSettled(boards);
const wallMs = performance.now() - t0;
const endSample = await sampleOnce();

// ---- verification
const finalState = (await db.query(cfg.store === 'rows' ? 'select 1' : 'select state from booth_store where id=1')).rows[0];
let final;
if (cfg.store === 'rows') { const { loadRowsState } = await import('../src/rowsStore.js'); final = (await loadRowsState(db)).state; } else final = finalState.state;
const board = await (await fetch(origin + '/api/booth/leaderboard')).json();
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
for (const p of players) {
  const r = final.missions[p.id];
  check(`${p.id} completed`, r?.phase === 'COMPLETED' && r.mission.status === 'complete', r?.phase);
  check(`${p.id} score`, r?.scoring?.total === expectedTotal(p), `${r?.scoring?.total}/${expectedTotal(p)}`);
  check(`${p.id} 4 station awards`, Object.keys(r?.scoring?.stations || {}).length === 4);
  check(`${p.id} event`, r?.eventId === final.events.activeEventId);
}
check('historical records unchanged', seedIds.every(id => JSON.stringify(final.missions[id]) === JSON.stringify(JSON.parse(seedFrozen)[id]) || JSON.stringify({ ...final.missions[id], eventId: undefined }) === JSON.stringify({ ...JSON.parse(seedFrozen)[id], eventId: undefined })));
check('mission count', Object.keys(final.missions).length === seedIds.length + cfg.players, `${Object.keys(final.missions).length}`);
const entryIds = board.entries.map(e => e.missionId);
for (const p of players) check(`${p.id} on leaderboard once`, entryIds.filter(x => x === p.id).length === 1);
check('leaderboard sorted', board.entries.every((e, i, a) => !i || a[i - 1].score >= e.score));
check('no foreign missions on active leaderboard', entryIds.every(id => (final.missions[id].eventId ?? final.events.legacyEventId) === final.events.activeEventId));
check('booth slots untouched', Object.keys(final.stations).length === Object.keys(seed.stations).length && final.sequence === seed.sequence);

const pct = (a, q) => { if (!a?.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))] * 10) / 10; };
const latency = Object.fromEntries(Object.entries(lat).filter(([k]) => !k.endsWith(':error')).map(([k, v]) => [k, { n: v.length, p50: pct(v, .5), p95: pct(v, .95), p99: pct(v, .99), max: pct(v, 1) }]));
const all = Object.entries(lat).filter(([k]) => !k.endsWith(':error')).flatMap(([, v]) => v);
const wall = (endSample?.t - startSample?.t) / 1000;
const cpuSec = (endSample && startSample && endSample.pid === startSample.pid) ? (endSample.cpu - startSample.cpu) / 1000 : null;
const errCount = Object.values(errors).reduce((a, b) => a + b, 0);
const completed = players.filter(p => p.done).length;
const report = {
  config: cfg, seed: { missions: seedIds.length, bytes: seedBytes }, wallSeconds: Math.round(wallMs / 100) / 10, requests, requestsPerSecond: Math.round(requests / (wallMs / 1000) * 10) / 10,
  completion: { completed, total: cfg.players, successRate: Math.round(completed / cfg.players * 1000) / 10, userRetries: players.reduce((a, p) => a + p.userRetries, 0), stuck: players.filter(p => p.failed).map(p => p.failed) },
  journeyMs: { p50: pct(players.filter(p => p.done).map(p => p.elapsedMs), .5), p95: pct(players.filter(p => p.done).map(p => p.elapsedMs), .95) },
  latencyMs: { all: { p50: pct(all, .5), p95: pct(all, .95), p99: pct(all, .99), max: pct(all, 1) }, byRequest: latency },
  errors: { total: errCount, rate: Math.round(errCount / Math.max(1, requests + errCount) * 10000) / 100, byType: errors }, injected, restarts, killedAtMs: killedAt,
  server: { peakRssMB: Math.round(Math.max(...samples.map(s => s.rss)) / 1048576), cpuSeconds: cpuSec && Math.round(cpuSec * 10) / 10, avgCpuCores: cpuSec && Math.round(cpuSec / wall * 100) / 100, cpuMsPerRequest: cpuSec && Math.round(cpuSec * 1000 / requests * 100) / 100 },
  checks: { passed: checks.filter(c => c.ok).length, failed: checks.filter(c => !c.ok) }
};
sampling = false; await sampler;
const telemetry = serverLogs.split('\n').filter(l => l.includes('"telemetry"')).slice(-1)[0];
if (telemetry) report.serverTelemetryLast = JSON.parse(telemetry.slice(telemetry.indexOf('{')));
const serverErrors = serverLogs.split('\n').filter(l => /error|exception|unhandled/i.test(l) && !l.includes('"telemetry"')).slice(0, 8);
report.serverLogErrors = serverErrors;
if (process.env.REPORT) writeFileSync(process.env.REPORT, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
if (child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
await db.end();
process.exitCode = report.checks.failed.length || completed !== cfg.players ? 1 : 0;
