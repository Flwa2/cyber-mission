# Render free deployment (one service + free Postgres)

Single public URL: `https://<service>.onrender.com/` (game) and `/?display=leaderboard` (Live Leaderboard).

## How it works

- `render.yaml` defines one free web service and one free Postgres database.
- With `SERVE_FRONTEND=true` the backend serves `frontend/dist` and exposes only the gameplay and leaderboard routes (same allow-list as `serveEvent.mjs`).
- With `DATABASE_URL` set, `backend/src/cloudStore.js` keeps the existing in-memory store and saves it as one JSON row in Postgres. Scoring and gameplay code are unchanged. Without `DATABASE_URL` the local file store and lock behave as before.
- Each start claims the row with a new `epoch`. An older instance that overlaps a redeploy fails its next write and exits, so it cannot overwrite newer data. Redeploy only when nobody is playing.
- The event scope (`leaderboard-event.json`) is stored inside the cloud store as `leaderboardEvent.excludedMissionIds`.

## Import existing data (once)

Run from the repository root against the database's *external* connection string, using a **backup copy** of the data:

```powershell
$env:DATABASE_URL="<external connection string from Render>"
node backend/scripts/importStateToPostgres.mjs backend/data/deploy-backup-<timestamp>/booth-state.json backend/data/deploy-backup-<timestamp>/leaderboard-event.json
```

The script refuses to overwrite an existing cloud row and verifies the imported copy.

## Free-tier limits

- Web service sleeps after 15 minutes without traffic; wake-up takes about one minute. Use an external pinger on `/api/health` every 5 minutes to reduce sleeping.
- Render may restart a free service at any time; saved data survives, and the last in-flight change is the only possible loss.
- Free Postgres is 1 GB, expires 30 days after creation, and has no backups. Export a copy after each event day.
