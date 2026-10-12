import pg from 'pg';

// Single JSON row in Postgres. Startup bumps `epoch`; an older instance that overlaps a
// redeploy then fails its epoch-checked writes instead of overwriting newer data.
export const ensureTable = db => db.query('create table if not exists booth_store(id int primary key, epoch bigint not null default 0, state jsonb not null, updated_at timestamptz not null default now())');
export const createPool = url => new pg.Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 10000, statement_timeout: 15000, ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false } });

export async function openCloudStore(url) {
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
    state: claimed.rows[0].state,
    async save(contents) {
      // Await the autocommit acknowledgement. Never acknowledge buffered writes or
      // retry an ambiguous failure using a possibly superseded in-memory snapshot.
      const result = await db.query('update booth_store set state = $1::jsonb, updated_at = now() where id = 1 and epoch = $2', [contents, epoch]);
      if (!result.rowCount) throw new Error('Cloud store claimed by a newer instance');
    },
    close() { return db.end(); }
  };
}
