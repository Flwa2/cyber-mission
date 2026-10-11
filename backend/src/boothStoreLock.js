import { existsSync, readFileSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

// This JSON prototype has one writer. Fail closed if another server owns the store.
export function lockStore(file) {
  mkdirSync(dirname(file), { recursive: true });
  const lock = file + '.lock';
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, 'utf8'));
    if (!Number.isInteger(pid) || pid <= 0) throw new Error(`Invalid booth store lock: ${lock}`);
    let alive = true;
    try { process.kill(pid, 0); } catch (error) {
      if (error.code === 'ESRCH') alive = false;
      else throw error;
    }
    if (alive) throw new Error(`Booth store already in use by process ${pid}: ${file}`);
    unlinkSync(lock);
  }
  const descriptor = openSync(lock, 'wx');
  writeFileSync(descriptor, String(process.pid));
  closeSync(descriptor);
  process.once('exit', () => {
    if (existsSync(lock) && readFileSync(lock, 'utf8') === String(process.pid)) unlinkSync(lock);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => process.exit(0));
}
