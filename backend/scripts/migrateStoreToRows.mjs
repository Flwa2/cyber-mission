// Reversible migration between the legacy single-document store (booth_store) and the
// row-per-mission store (booth_meta + booth_missions).
//
//   node scripts/migrateStoreToRows.mjs                 dry run (default, read-only)
//   node scripts/migrateStoreToRows.mjs --apply         backup, import, verify
//   node scripts/migrateStoreToRows.mjs --rollback --apply   export rows back into booth_store
//
// DATABASE_URL (or --url-env NAME) selects the database. A non-local database additionally
// needs --confirm-production. The legacy booth_store row is never modified by --apply; it is
// only written by --rollback --apply (with an epoch bump that fences any running instance).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createPool, ensureTable } from '../src/cloudStore.js';
import { importDocumentToRows, loadRowsState } from '../src/rowsStore.js';

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const apply = flag('--apply'), rollback = flag('--rollback');
const urlEnv = args[args.indexOf('--url-env') + 1] && args.includes('--url-env') ? args[args.indexOf('--url-env') + 1] : 'DATABASE_URL';
const url = process.env[urlEnv];
if (!url) { console.error(`${urlEnv} is not set.`); process.exit(2); }
const local = /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(url);
if (!local && !flag('--confirm-production')) { console.error('Non-local database: add --confirm-production once the maintenance window is approved.'); process.exit(2); }

const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const summary = state => ({ missions: Object.keys(state.missions || {}).length, events: (state.events?.list || state.events || []).length ?? 0, bytes: Buffer.byteLength(JSON.stringify(state)) });
const backup = (label, payload) => {
  const dir = path.resolve(process.cwd(), '..', 'tmp', 'migration-backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const text = JSON.stringify(payload);
  fs.writeFileSync(file, text, { mode: 0o600 });
  if (sha(fs.readFileSync(file, 'utf8')) !== sha(text)) throw new Error('Backup verification failed');
  return { file, sha256: sha(text), bytes: text.length };
};

const db = createPool(url);
db.on('error', () => {});
try {
  if (!rollback) {
    const doc = await db.query('select epoch, state from booth_store where id = 1');
    if (!doc.rowCount) throw new Error('booth_store has no document; nothing to migrate');
    const { epoch, state } = doc.rows[0];
    const rowsExist = (await db.query("select to_regclass('booth_meta') as t")).rows[0].t && (await db.query('select 1 from booth_meta where id = 1')).rowCount;
    console.log('Source document:', JSON.stringify({ epoch: String(epoch), ...summary(state) }));
    console.log('Row store already initialized:', Boolean(rowsExist));
    if (!apply) { console.log('DRY RUN: nothing written. Re-run with --apply to migrate.'); process.exit(0); }
    if (rowsExist) throw new Error('Row store already initialized; refusing to overwrite');
    const saved = backup('booth_store', { epoch: String(epoch), state });
    console.log('Backup written and re-read OK:', JSON.stringify({ file: path.basename(saved.file), sha256: saved.sha256, bytes: saved.bytes }));
    await importDocumentToRows(db, state, { epoch: Number(epoch) });
    const loaded = await loadRowsState(db);
    if (canonical(loaded.state) !== canonical(state)) throw new Error('Verification failed: row store differs from source document');
    const after = await db.query('select epoch, state from booth_store where id = 1');
    if (canonical(after.rows[0].state) !== canonical(state) || String(after.rows[0].epoch) !== String(epoch)) throw new Error('Source document changed during migration (writers were active); rollback by dropping row tables and retry in a quiet window');
    console.log('MIGRATION VERIFIED: row store is identical to the source document.', JSON.stringify(summary(loaded.state)));
    console.log('Next: set BOOTH_STORE_MODE=rows and deploy. booth_store was left untouched.');
  } else {
    if (!(await db.query("select to_regclass('booth_meta') as t")).rows[0].t) throw new Error('Row store does not exist; nothing to export');
    const loaded = await loadRowsState(db);
    if (!loaded) throw new Error('Row store is empty; nothing to export');
    console.log('Row store:', JSON.stringify({ epoch: String(loaded.epoch), ...summary(loaded.state) }));
    if (!apply) { console.log('DRY RUN: nothing written. Stop the service (or unset BOOTH_STORE_MODE after) and re-run with --rollback --apply.'); process.exit(0); }
    const saved = backup('booth_rows', { epoch: String(loaded.epoch), state: loaded.state });
    console.log('Backup written and re-read OK:', JSON.stringify({ file: path.basename(saved.file), sha256: saved.sha256 }));
    await ensureTable(db);
    const doc = await db.query('select epoch from booth_store where id = 1');
    const nextEpoch = Math.max(Number(doc.rows[0]?.epoch ?? 0), Number(loaded.epoch)) + 1;
    await db.query('insert into booth_store(id, epoch, state) values (1, $1, $2::jsonb) on conflict (id) do update set epoch = excluded.epoch, state = excluded.state, updated_at = now()', [nextEpoch, JSON.stringify(loaded.state)]);
    await db.query('update booth_meta set epoch = epoch + 1 where id = 1'); // fences any rows-mode instance still running
    const check = await db.query('select state from booth_store where id = 1');
    if (canonical(check.rows[0].state) !== canonical(loaded.state)) throw new Error('Rollback verification failed');
    console.log('ROLLBACK VERIFIED: booth_store now holds every mission from the row store. Unset BOOTH_STORE_MODE and redeploy. Row tables were kept.');
  }
} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally { await db.end().catch(() => {}); }
