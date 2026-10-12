import pg from 'pg';

// Legacy mode: single JSON row in Postgres. Startup bumps `epoch`; an older instance that overlaps a
// redeploy then fails its epoch-checked writes instead of overwriting newer data.
// BOOTH_STORE_MODE=rows switches to one row per mission (see rowsStore.js).
export const ensureTable = db => db.query('create table if not exists booth_store(id int primary key, epoch bigint not null default 0, state jsonb not null, updated_at timestamptz not null default now())');
export const createPool = url => new pg.Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX) || 4, connectionTimeoutMillis: 10000, statement_timeout: 15000, keepAlive: true, ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false } });

const TRANSIENT_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', '57P01', '57P02', '57P03', '53300', '08000', '08001', '08003', '08006', '40001', '40P01']);
export const isTransientDbError = error => TRANSIENT_CODES.has(error?.code) || /Connection terminated|timeout exceeded when trying to connect|ECONNRESET/i.test(String(error?.message));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Bounded retry of an idempotent, epoch-fenced statement. Never retries a fenced write.
export async function retryQuery(db, text, values, { attempts = 3, baseMs = 150 } = {}) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await db.query(text, values); } catch (error) {
      last = error;
      if (!isTransientDbError(error) || attempt === attempts) break;
      console.error(`Cloud store transient error (${error.code || error.message}); retry ${attempt}/${attempts - 1}`);
      await wait(baseMs * 2 ** (attempt - 1) + Math.random() * 100);
    }
  }
  throw last;
}

export async function openCloudStore(url) {
  if (process.env.BOOTH_STORE_MODE === 'rows') return (await import('./rowsStore.js')).openRowsStore(url);
  const db = createPool(url);
  db.on('error', () => console.error('Cloud store connection interrupted'));
  let claimed;
  try {
    await ensureTable(db);
    claimed = await db.query('update booth_store set epoch = epoch + 1 where id = 1 returning epoch, state');
    if (!claimed.rowCount) throw new Error('Cloud booth store is empty; run backend/scripts/importStateToPostgres.mjs first (refusing to start with no data)');
  } catch (error) { await db.end(); throw error; }
  const epoch = claimed.rows[0].epoch;
  return {
    mode: 'doc',
    state: claimed.rows[0].state,
    async save(contents) {
      // Retrying the identical statement is idempotent: it is epoch-fenced and
      // replaces the whole document with the same contents.
      const result = await retryQuery(db, 'update booth_store set state = $1::jsonb, updated_at = now() where id = 1 and epoch = $2', [contents, epoch]);
      if (!result.rowCount) throw Object.assign(new Error('Cloud store claimed by a newer instance'), { fenced: true });
    },
    async reload() {
      const result = await retryQuery(db, 'select state from booth_store where id = 1 and epoch = $1', [epoch]);
      if (!result.rowCount) throw Object.assign(new Error('Cloud store claimed by a newer instance'), { fenced: true });
      return result.rows[0].state;
    },
    ping: () => db.query('select 1'),
    close() { return db.end(); }
  };
}
