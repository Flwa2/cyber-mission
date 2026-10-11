# Persistent participant and score records

The backend uses the existing JSON booth store through `backend/src/persistentStore.js`.
No external service is provisioned. Node 22 or later is required. One Node process
owns the file, using the existing process lock. Synchronous transactions copy state,
write and flush a temporary file, and atomically rename it before publishing the new
in-memory state. POSIX directory metadata is also flushed. A write failure blocks
further reads/writes until the process is restarted after storage inspection.

`BOOTH_STORE_FILE` defaults to `backend/data/booth-state.json` when launched from
the backend directory. Existing files are loaded without replacing or migrating
their mission records. The previous committed snapshot is saved as `.bak` before
each changed transaction. This is a local recovery copy, not off-volume disaster
recovery. Corrupt primary data, or a missing primary with an existing backup,
fails closed: backup restoration must be an explicit operator decision.

## Persisted data and boundaries

- `missions[missionId]`: existing player name/avatar, language, creation/start/update
  times, progress/status, decisions, evidence, private case snapshots and FIFO state.
- Completion timestamps remain in `mission.decisions.station01` through `station04`;
  `station04.completedAt` is the completed mission timestamp.
- `record.scoring`: immutable finalized station awards, financial/investigation
  components, finalization timestamps, cumulative total and the 5,000 maximum.
- `stations` and sequence counters: existing device/queue recovery information.
- `legacyMissions`: formerly in-memory `/api/missions` records. Repeated create for
  the same ID returns the existing record. This namespace is excluded from the
  authoritative scoring and leaderboard, even if a client patches score-like fields.

Scores, decisions and station handoff are committed in the same transaction.
The scoring algorithm and duplicate-finalization checks are unchanged. Leaderboard
reads use the persisted booth records and retain their existing public allowlist;
private cases, answers and evidence are not added to the display API. Storage adds
no participant personal fields, credentials or external-service secrets.

## Production decision still required

This is portable **single-instance preparation**, not durable hosting by itself.
Before an event, choose either:

1. A single backend instance with a genuinely persistent mounted volume, private
   filesystem access and independently retained backups; or
2. A managed transactional database and a subsequent storage-adapter integration
   if the host is ephemeral/serverless or multiple backend instances are required.

Do not share this file across hosts or run clustered Node workers. The PID lock
only protects writers on one host. HTTPS, network access controls, storage access
permissions, backup retention and restore drills remain deployment responsibilities.
Do not serve the data directory as static files or commit it to Git.

Production startup requires all of:

```
NODE_ENV=production
BOOTH_STORE_FILE=/absolute/path/on/the/persistent-volume/booth-state.json
BOOTH_STORAGE_DURABILITY=persistent-volume
```

The declaration does not verify the hosting provider's durability guarantee.
Startup refuses an absent file to prevent an accidental empty competition after
redeployment. Migrate the existing primary with the backend stopped, verify its
records, and retain an independent backup before starting production. For a truly
new installation only, initialize the approved mounted path with exclusive-create
(`wx`) and `{ "sequence": 0, "missions": {}, "stations": {} }`; never overwrite an
existing store. No initialization or deployment is performed by this change.

Development keeps the existing default path and automatic first-write creation.
Browser refresh reads the same backend state. Killing/restarting Node does not
erase acknowledged writes; losing an ephemeral volume still would.

## Focused verification

From `backend`: `node scripts/validatePersistence.mjs` checks legacy API restart,
parallel record isolation, duplicate create, lock exclusion, rollback, corruption
and production guards. Existing `validateProgressiveScoring.mjs`, `validateBooth.mjs`,
`validateLeases.mjs` and `validateCases.mjs` exercise real booth persistence,
authoritative totals, retries, leaderboard reads and recovery on isolated test stores.
