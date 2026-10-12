// Restore a native backup ONLY into an empty, disposable localhost *_test database.
// Does not load release credentials or contact production.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import pg from 'pg';

const directory = resolve(process.argv[2]);
const target = new URL(process.env.TEST_DATABASE_URL || 'http://invalid');
assert(['127.0.0.1', 'localhost'].includes(target.hostname) && target.pathname.endsWith('_test'), 'Requires a disposable localhost *_test database');
assert(process.env.BACKUP_PG_CONTAINER?.startsWith('cyber-mission-release-check-'), 'Requires the isolated release-check container');
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json')));
const backup = JSON.parse(readFileSync(resolve(directory, 'database.json')));
const digest = file => createHash('sha256').update(readFileSync(resolve(directory, file))).digest('hex');
assert.equal(digest('database.json'), manifest.sha256);
assert.equal(digest('database.dump'), manifest.nativeDump.sha256);
const db = new pg.Client({ connectionString: target.href, ssl: false });
await db.connect();
try {
  const existing = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  assert.equal(existing.rowCount, 0, 'Restore target is not empty; refusing to overwrite');
  const fd = openSync(resolve(directory, 'database.dump'), 'r');
  try {
    await new Promise((done, reject) => {
      const child = spawn('docker', ['exec', '-i', process.env.BACKUP_PG_CONTAINER, 'pg_restore', '--username', 'postgres', '--dbname', decodeURIComponent(target.pathname.slice(1)), '--no-owner', '--no-acl', '--exit-on-error'], { windowsHide: true, stdio: [fd, 'ignore', 'pipe'] });
      child.stderr.resume(); child.on('error', reject);
      child.on('close', code => code === 0 ? done() : reject(new Error('Native restore failed')));
    });
  } finally { closeSync(fd); }
  const rows = (await db.query('SELECT id,epoch,state,updated_at FROM booth_store ORDER BY id')).rows;
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), backup.rows, 'Native restore must exactly match the JSON snapshot');
  assert.equal(Object.keys(rows[0].state.missions).length, manifest.missions);
  assert.equal(manifest.historicalMissionsVerified, 13);
  const result = { verifiedAt: new Date().toISOString(), nativeRestoreVerified: true, allRowsMatchJsonSnapshot: true, missions: manifest.missions, historicalMissions: 13, productionModified: false };
  writeFileSync(resolve(directory, `restore-verification-${result.verifiedAt.replace(/[:.]/g,'-')}.json`), JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600, flush: true });
  console.log(JSON.stringify(result));
} finally { await db.end(); }
