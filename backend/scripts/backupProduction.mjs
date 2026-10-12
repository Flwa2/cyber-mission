// Read-only application database export. Never imports/initializes the live store.
// Run from repository root: node backend/scripts/backupProduction.mjs
// Connection is loaded privately from the ignored backend/.env.release file.
import pg from 'pg';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
let client;
try {
  process.loadEnvFile(resolve('backend/.env.release'));
  assert(process.env.DATABASE_URL, 'Database connection missing');
  client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, statement_timeout: 20000 });
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  assert.equal((await client.query('SHOW transaction_read_only')).rows[0].transaction_read_only, 'on');
  const tables = (await client.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY schemaname,tablename")).rows;
  assert.deepEqual(tables, [{ schemaname: 'public', tablename: 'booth_store' }], 'Unexpected tables: a full database export is required');
  const rows = (await client.query('SELECT id, epoch, state, updated_at FROM public.booth_store ORDER BY id')).rows;
  assert.equal(rows.length, 1, 'Unexpected number of store rows');
  assert.equal(rows[0].id, 1);
  const state = rows[0].state;
  const baseline = JSON.parse(readFileSync('backend/data/booth-state.json', 'utf8'));
  const historical = Object.entries(baseline.missions);
  assert.equal(historical.length, 13, 'Historical baseline must contain the expected 13 missions');
  for (const [id, record] of historical) {
    assert(state.missions[id], 'A historical mission is missing');
    assert.equal(state.missions[id].mission.playerName, record.mission.playerName, 'Historical name differs');
    assert.deepEqual(state.missions[id].scoring, record.scoring, 'Historical scoring differs');
  }
  const schema = (await client.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='booth_store' ORDER BY ordinal_position")).rows;
  const constraints = (await client.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.booth_store'::regclass ORDER BY conname")).rows;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = resolve('tmp', `production-backup-${stamp}`);
  mkdirSync(directory, { recursive: true });
  const backup = { format: 'cyber-mission-postgres-export-v1', capturedAt: new Date().toISOString(), schema, constraints, rows };
  let nativeDump;
  if (process.env.BACKUP_PG_CONTAINER) {
    // pg_dump shares this exact read-only snapshot, even if live players keep playing.
    const snapshot = (await client.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
    const connection = new URL(process.env.DATABASE_URL);
    const pgEnv = { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || '5432', PGDATABASE: decodeURIComponent(connection.pathname.slice(1)), PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password), PGSSLMODE: 'require', PGCONNECT_TIMEOUT: '15' };
    const dumpPath = resolve(directory, 'database.dump');
    const fd = openSync(dumpPath, 'wx', 0o600);
    try {
      await new Promise((done, reject) => {
        const child = spawn('docker', ['exec', ...['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE', 'PGCONNECT_TIMEOUT'].flatMap(key => ['--env', key]), process.env.BACKUP_PG_CONTAINER, 'pg_dump', '--format=custom', '--no-owner', '--no-acl', '--snapshot', snapshot], { env: pgEnv, windowsHide: true, stdio: ['ignore', fd, 'pipe'] });
        child.stderr.resume();
        child.on('error', () => reject(new Error('Native backup unavailable')));
        child.on('close', code => code === 0 ? done() : reject(new Error('Native backup failed')));
      });
    } finally { closeSync(fd); }
    nativeDump = { file: 'database.dump', sha256: createHash('sha256').update(readFileSync(dumpPath)).digest('hex'), sameSnapshot: true };
  }
  const file = resolve(directory, 'database.json');
  writeFileSync(file, JSON.stringify(backup, null, 2), { mode: 0o600, flag: 'wx', flush: true });
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(hash(saved.rows[0].state), hash(state));
  const again = (await client.query('SELECT id, epoch, state, updated_at FROM public.booth_store ORDER BY id')).rows;
  assert.equal(hash(JSON.parse(JSON.stringify(again))), hash(saved.rows));
  await client.query('COMMIT');
  const manifest = { capturedAt: backup.capturedAt, file: 'database.json', sha256: createHash('sha256').update(readFileSync(file)).digest('hex'), missions: Object.keys(state.missions).length, historicalMissionsVerified: historical.length, historicalScoresUnchanged: true, readOnlySnapshot: true, stateSha256: hash(state), ...(nativeDump ? { nativeDump } : {}) };
  writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx', flush: true });
  console.log(JSON.stringify({ directory, ...manifest }));
} catch (error) {
  // Driver messages/connection strings must never leak into terminals or logs.
  console.error('Production backup failed; no production writes were made.', error instanceof assert.AssertionError ? error.message.split('\n')[0] : /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'Connection or export error');
  process.exitCode = 1;
} finally { await client?.end().catch(() => {}); }
