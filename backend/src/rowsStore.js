import { createPool, retryQuery } from './cloudStore.js';

// Incremental persistence: one row per mission plus one small metadata row.
// Additive to the legacy booth_store document, which is never modified here.
export const ensureRowsTables = async db => {
  await db.query('create table if not exists booth_meta(id int primary key, epoch bigint not null default 0, version bigint not null default 0, meta jsonb not null, updated_at timestamptz not null default now())');
  await db.query('create table if not exists booth_missions(mission_id text primary key, event_id text, revision int, doc jsonb not null, updated_at timestamptz not null default now())');
  await db.query('create index if not exists booth_missions_event_idx on booth_missions(event_id)');
};

const split = state => {
  const { missions, ...meta } = state;
  return { meta, missions };
};
const missionRow = (id, doc) => ({ mission_id: id, event_id: doc.eventId ?? null, revision: Number.isSafeInteger(doc.revision) ? doc.revision : null, doc });

// Imports a whole document into empty row tables inside one transaction.
export async function importDocumentToRows(db, state, { epoch = 0 } = {}) {
  await ensureRowsTables(db);
  const client = await db.connect();
  try {
    await client.query('begin');
    const existing = await client.query('select 1 from booth_meta where id = 1 for update');
    if (existing.rowCount) throw new Error('Row store already initialized; refusing to overwrite');
    const { meta, missions } = split(state);
    await client.query('insert into booth_meta(id, epoch, version, meta) values (1, $1, 0, $2::jsonb)', [epoch, JSON.stringify(meta)]);
    const rows = Object.entries(missions).map(([id, doc]) => missionRow(id, doc));
    for (let i = 0; i < rows.length; i += 200) {
      await client.query('insert into booth_missions(mission_id, event_id, revision, doc) select r.mission_id, r.event_id, r.revision, r.doc from jsonb_to_recordset($1::jsonb) as r(mission_id text, event_id text, revision int, doc jsonb)', [JSON.stringify(rows.slice(i, i + 200))]);
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally { client.release(); }
}

export async function loadRowsState(db, queryable = db) {
  const metaRow = await queryable.query('select epoch, version, meta from booth_meta where id = 1');
  if (!metaRow.rowCount) return null;
  const rows = await queryable.query('select mission_id, doc from booth_missions');
  const missions = {};
  for (const row of rows.rows) missions[row.mission_id] = row.doc;
  return { state: { ...metaRow.rows[0].meta, missions }, epoch: metaRow.rows[0].epoch, version: metaRow.rows[0].version };
}

const SAVE_SQL = `
with g as (update booth_meta set meta = coalesce($1::jsonb, meta), version = version + 1, updated_at = now() where id = 1 and epoch = $2 returning 1),
u as (insert into booth_missions(mission_id, event_id, revision, doc, updated_at)
      select r.mission_id, r.event_id, r.revision, r.doc, now()
      from jsonb_to_recordset($3::jsonb) as r(mission_id text, event_id text, revision int, doc jsonb)
      where exists (select 1 from g)
      on conflict (mission_id) do update set event_id = excluded.event_id, revision = excluded.revision, doc = excluded.doc, updated_at = now()
      returning 1),
d as (delete from booth_missions where mission_id = any($4::text[]) and exists (select 1 from g) returning 1)
select (select count(*) from g)::int as guard, (select count(*) from u)::int as upserted`;

export async function openRowsStore(url) {
  const db = createPool(url);
  db.on('error', () => console.error('Cloud store connection interrupted'));
  let claimed;
  try {
    await ensureRowsTables(db);
    claimed = await db.query('update booth_meta set epoch = epoch + 1 where id = 1 returning epoch');
    if (!claimed.rowCount) throw new Error('Row store is empty; run backend/scripts/migrateStoreToRows.mjs first (refusing to start with no data)');
  } catch (error) { await db.end(); throw error; }
  const epoch = claimed.rows[0].epoch;
  const loaded = await loadRowsState(db);
  return {
    mode: 'rows',
    state: loaded.state,
    async saveChanges({ meta, upserts, deletes }) {
      const result = await retryQuery(db, SAVE_SQL, [meta ? JSON.stringify(meta) : null, epoch, JSON.stringify(upserts.map(([id, doc]) => missionRow(id, doc))), deletes]);
      if (!result.rows[0].guard) throw Object.assign(new Error('Cloud store claimed by a newer instance'), { fenced: true });
    },
    async reload() {
      const client = await db.connect();
      try {
        await client.query('begin isolation level repeatable read read only');
        const current = await client.query('select epoch from booth_meta where id = 1');
        if (String(current.rows[0]?.epoch) !== String(epoch)) throw Object.assign(new Error('Cloud store claimed by a newer instance'), { fenced: true });
        const fresh = await loadRowsState(db, client);
        await client.query('commit');
        return fresh.state;
      } catch (error) { await client.query('rollback').catch(() => {}); throw error; } finally { client.release(); }
    },
    ping: () => db.query('select 1'),
    close: () => db.end()
  };
}
