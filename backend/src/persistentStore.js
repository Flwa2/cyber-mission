import { existsSync, readFileSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { lockStore } from './boothStoreLock.js';

// One local writer only. Production must explicitly supply an existing store
// on a durable volume; an ephemeral container path is not a database service.
const configured = process.env.BOOTH_STORE_FILE;
// Cloud mode: the same in-memory store, saved as one JSON row in Postgres. Setting DATABASE_URL enables it.
const cloud = process.env.DATABASE_URL ? await import('./cloudStore.js').then(m => m.openCloudStore(process.env.DATABASE_URL)) : null;
if (!cloud && process.env.NODE_ENV === 'production' &&
    (!configured || !isAbsolute(configured) || process.env.BOOTH_STORAGE_DURABILITY !== 'persistent-volume' || !existsSync(configured))) {
  throw new Error('Production requires an existing absolute BOOTH_STORE_FILE on a persistent volume and BOOTH_STORAGE_DURABILITY=persistent-volume');
}
const file = resolve(configured || 'data/booth-state.json');
if (!cloud) lockStore(file);
if (!cloud && !existsSync(file) && existsSync(file + '.bak')) throw new Error('Primary booth store missing; recover explicitly from a verified backup');
let state = cloud ? cloud.state : existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { sequence:0, missions:{}, stations:{} };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
if (!object(state) || !Number.isSafeInteger(state.sequence) || state.sequence < 0 || !object(state.missions) || !object(state.stations) || (state.legacyMissions !== undefined && !object(state.legacyMissions))) {
  throw new Error('Invalid booth store; refusing to initialize over existing records');
}
function replace(path, contents) {
  writeFileSync(path + '.tmp', contents, { encoding:'utf8', mode:0o600, flush:true });
  renameSync(path + '.tmp', path);
  // POSIX directory sync makes the rename durable. Windows cannot open a
  // directory with this API; file contents are still flushed before rename.
  if (process.platform !== 'win32') {
    const fd = openSync(dirname(path), 'r');
    try { fsyncSync(fd); } finally { closeSync(fd); }
  }
}

// Committed state is replaced, never mutated in place, so untouched mission records are shared by
// reference between versions and their serialized form is cached.
const jsonCache = new WeakMap();
const recordJson = record => { let json = jsonCache.get(record); if (json === undefined) { json = JSON.stringify(record); jsonCache.set(record, json); } return json; };
const metaOf = value => { const { missions, ...rest } = value; return rest; };
let committedMeta = cloud ? JSON.stringify(metaOf(state)) : null;
let version = 0, fenced = false, needsResync = false, lastFailureAt = 0;
let failed = false;
export const storeStats = { transactions: 0, writes: 0, writeBytes: 0, failures: 0, retriedResyncs: 0, cloneMs: 0, saveMs: 0, slow: 0 };
const unavailable = cause => Object.assign(new Error('Storage temporarily unavailable; please retry'), { status: 503, transient: true, cause });
const healthy = () => {
  if (failed) throw new Error("Storage write failed; restart after checking the store before accepting further requests");
  if (fenced) throw new Error('This instance was superseded by a newer deployment');
};
let pending = Promise.resolve();

async function cloudCommit(build) {
  if (fenced) throw unavailable(new Error('fenced'));
  if (needsResync) {
    // A previous save may or may not have committed. Re-read the fenced database state
    // before serving further writes so memory never diverges from what is durable.
    try {
      state = await cloud.reload();
      committedMeta = JSON.stringify(metaOf(state));
      needsResync = false; storeStats.retriedResyncs++;
      console.error(JSON.stringify({ event: 'store-resynced' }));
    } catch (error) { if (error.fenced) fenced = true; console.error(JSON.stringify({ event: 'store-resync-failed', code: error.code || null, message: String(error.message).slice(0, 200) })); throw unavailable(error); }
  }
  const started = performance.now();
  const { next, result, ids } = build();
  if (result && typeof result.then === 'function') throw new Error('Storage transactions must be synchronous');
  const upserts = [], deletes = [];
  for (const id of ids || new Set([...Object.keys(state.missions), ...Object.keys(next.missions)])) {
    const old = state.missions[id], now = next.missions[id];
    if (!now) { if (old) deletes.push(id); continue; }
    if (old && recordJson(old) === JSON.stringify(now)) next.missions[id] = old; else upserts.push([id, now]);
  }
  const nextMeta = JSON.stringify(metaOf(next));
  const metaChanged = nextMeta !== committedMeta;
  storeStats.transactions++;
  storeStats.cloneMs += performance.now() - started;
  if (upserts.length || deletes.length || metaChanged) {
    const saveStarted = performance.now();
    try {
      if (cloud.mode === 'rows') await cloud.saveChanges({ meta: metaChanged ? metaOf(next) : null, upserts, deletes });
      else { const contents = JSON.stringify(next); storeStats.writeBytes += contents.length; await cloud.save(contents); }
    } catch (error) {
      storeStats.failures++; lastFailureAt = Date.now();
      console.error(JSON.stringify({ event: 'store-write-failed', code: error.code || null, message: String(error.message).slice(0, 200), fenced: Boolean(error.fenced) }));
      if (error.fenced) fenced = true; else needsResync = true;
      throw unavailable(error);
    }
    const elapsed = performance.now() - saveStarted;
    storeStats.saveMs += elapsed; storeStats.writes++;
    if (elapsed > 250) { storeStats.slow++; console.error(JSON.stringify({ event: 'slow-store-write', ms: Math.round(elapsed), upserts: upserts.length })); }
    for (const [, doc] of upserts) jsonCache.set(doc, JSON.stringify(doc));
    state = next; committedMeta = nextMeta; version++;
  }
  return structuredClone(result);
}
const queueCloud = build => {
  const committed = pending.then(() => cloudCommit(build));
  pending = committed.catch(() => {});
  return committed;
};

export const persistentStore = {
  assertHealthy: healthy,
  status: () => ({ mode: cloud ? cloud.mode : 'file', version, fenced, degraded: needsResync, lastFailureAt }),
  ping: () => cloud?.ping?.(),
  flush: () => pending,
  close: () => cloud?.close?.(),
  get version() { return version; },
  // Committed state by reference: callers must treat it as read-only.
  peek() { healthy(); return state; },
  read() { healthy(); return structuredClone(state); },
  // Like transaction(), for handlers that touch one mission record and shared meta only.
  scoped(id, fn) {
    if (!cloud) return this.transaction(fn);
    return queueCloud(() => {
      const old = state.missions[id];
      const next = { ...structuredClone(metaOf(state)), missions: old ? { [id]: structuredClone(old) } : {} };
      const result = fn(next);
      const { missions, ...rest } = next;
      return { next: { ...rest, missions: { ...state.missions, ...missions } }, result, ids: [id] };
    });
  },
  transaction(fn) {
    if (cloud) {
      // Serialize read/modify/commit, including concurrent players. Read-only
      // endpoints see only committed state. A failed save leaves memory unchanged.
      return queueCloud(() => {
        const next = structuredClone(state);
        const result = fn(next);
        return { next, result, ids: null };
      });
    }
    healthy();
    // Never await: claims, decisions and awards commit together on one process.
    const next = structuredClone(state);
    const result = fn(next);
    if (result && typeof result.then === 'function') throw new Error('Storage transactions must be synchronous');
    const contents = JSON.stringify(next);
    if (contents !== JSON.stringify(state)) {
      try {
        if (existsSync(file)) replace(file + '.bak', JSON.stringify(state));
        replace(file, contents);
      } catch (error) { failed = true; throw error; }
      state = next;
      version++;
    }
    return structuredClone(result);
  }
};
