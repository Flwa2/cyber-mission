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
let failed = false;
const healthy = () => { if (failed) throw new Error("Storage write failed; restart after checking the store before accepting further requests"); };
export const persistentStore = {
  read() { healthy(); return structuredClone(state); },
  transaction(fn) {
    healthy();
    // Never await: claims, decisions and awards commit together on one process.
    const next = structuredClone(state);
    const result = fn(next);
    if (result && typeof result.then === 'function') throw new Error('Storage transactions must be synchronous');
    const contents = JSON.stringify(next);
    if (contents !== JSON.stringify(state)) {
      if (cloud) { state = next; cloud.save(contents); return structuredClone(result); }
      try {
        if (existsSync(file)) replace(file + '.bak', JSON.stringify(state));
        replace(file, contents);
      } catch (error) { failed = true; throw error; }
      state = next;
    }
    return structuredClone(result);
  }
};
