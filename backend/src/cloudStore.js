import pg from 'pg';

// Single JSON row in Postgres. Startup bumps `epoch`; an older instance that overlaps a
// redeploy then fails its epoch-checked writes and exits instead of overwriting newer data.
export const ensureTable = db => db.query('create table if not exists booth_store(id int primary key, epoch bigint not null default 0, state jsonb not null, updated_at timestamptz not null default now())');
export const createPool = url => new pg.Pool({ connectionString: url, max: 2, ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false } });

export async function openCloudStore(url) {
  const db = createPool(url);
  await ensureTable(db);
  const claimed = await db.query('update booth_store set epoch = epoch + 1 where id = 1 returning epoch, state');
  if (!claimed.rowCount) throw new Error('Cloud booth store is empty; run backend/scripts/importStateToPostgres.mjs first (refusing to start with no data)');
  const epoch = claimed.rows[0].epoch;
  let pending = null, writing = null;
  const write = async () => {
    while (pending !== null) {
      const contents = pending; pending = null;
      try {
        const result = await db.query('update booth_store set state = $1::jsonb, updated_at = now() where id = 1 and epoch = $2', [contents, epoch]);
        if (!result.rowCount) { console.error('Cloud store claimed by a newer instance; exiting.'); process.exit(1); }
      } catch (error) {
        console.error('Cloud store write failed; retrying:', error.message);
        if (pending === null) pending = contents;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    writing = null;
  };
  const drain = async () => { while (writing) await writing; };
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    if (stopping) return;
    stopping = true;
    await Promise.race([drain(), new Promise(resolve => setTimeout(resolve, 8000))]);
    process.exit(0);
  });
  return {
    state: claimed.rows[0].state,
    save(contents) { pending = contents; if (!writing) writing = write(); }
  };
}
