# Production reliability and scalability

Status: implemented locally, **not committed, not deployed, production untouched**.

## Safe by default

The new code is additive. Without `BOOTH_STORE_MODE=rows` the server keeps using the legacy single-document table `booth_store` (now with retries, no permanent failure latch and far less cloning). Row mode is opt-in, after a verified migration.

## Persistence architecture

| | Legacy document (`booth_store`) | Row store (`booth_meta` + `booth_missions`) |
|---|---|---|
| Write cost | Whole state (about 1 MB and growing) per mutation | Only changed missions, one statement |
| Atomicity | Single row update | Single CTE statement, epoch-guarded |
| Fencing | `epoch` column | Same epoch semantics in `booth_meta` |
| Event isolation | Inside the document | Inside each mission, plus `event_id` index |
| Rollback | n/a | `migrateStoreToRows.mjs --rollback --apply` |

The legacy row is never modified by the migration. It is only rewritten by an explicit rollback.

## Migration runbook (needs explicit approval, run in a quiet window)

1. Deploy the new commit **without** changing the store mode (no behaviour change).
2. Take a read-only backup of `booth_store` and store it off-repo.
3. Stop traffic (nobody mid-mission). Dry run: `node scripts/migrateStoreToRows.mjs --confirm-production` with `DATABASE_URL` set. It reads only.
4. `node scripts/migrateStoreToRows.mjs --apply --confirm-production`. It writes a checksummed backup, imports in one transaction, deep-compares, and re-checks the source did not change.
5. Set `BOOTH_STORE_MODE=rows` and deploy manually. Check `/api/health`, the leaderboard and the previous results.
6. Rollback: stop the service, `--rollback --apply --confirm-production`, unset `BOOTH_STORE_MODE`, redeploy.

## Validation commands

- `cd backend && npm test`; `cd frontend && npm test && npm run build`
- Postgres (disposable localhost `*_test` database only): `node scripts/validateCloudPersistence.mjs <backup>` and `node scripts/validateRowsPersistence.mjs <backup>`
- Load: `PLAYERS=20 CLIENT=resilient FAULTS=all STORE=rows REPORT=... node scripts/loadTest.mjs <backup>` (env `TEST_DATABASE_URL`)

## Runtime behaviour

- Health returns 200 `ok` / `degraded`; only a fenced or file-mode failure returns 503.
- A failed save sets a resync flag; the next request reloads from PostgreSQL, so no restart is needed.
- Transient database errors are retried up to 3 times with jittered backoff; a fenced write is never retried.
- Uncaught exceptions are logged and survived (exit only after more than 10 in 60 s).
- Graceful SIGTERM drain; `keepAliveTimeout` 65 s to avoid proxy 502s.
- One JSON telemetry line per minute (RSS, CPU, loop lag, request and store stats) and `slow-store-write` / `slow-request` logs.
- Public leaderboard reads are cached per store version with an ETag.
- Frontend: `requestJson` turns HTML 502/503, empty bodies and timeouts into friendly retryable errors, retries only safe mutations (server revision checks answer a replay with 409 plus the committed mission), backs polls off with jitter, and retries failed images twice.
