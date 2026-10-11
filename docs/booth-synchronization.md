# Automatic booth handoff (prototype)

Station 02 now runs real desk gameplay. See [Station 02 integration](station02-desk.md). The original placeholder validation notes below describe the earlier synchronization-only iteration; Stations 03/04 remain placeholders.

Run one Node backend for one store. The backend owns station assignments, queues and acknowledged mission snapshots. Station 01 retains a local working copy until its updates are acknowledged. Connection failures block the screen and retry; a revision conflict offers explicit restoration of the server-saved mission rather than overwriting it.

## Start locally / on the host laptop

From the repository root in PowerShell:

```powershell
npm install
$env:PORT='4000'
$env:BOOTH_API_TARGET='http://127.0.0.1:4000'
$env:BOOTH_DEV_RECOVERY='true'
npm run dev
```

Use the actual Vite port printed in the terminal (normally 5173). Both servers bind to 0.0.0.0. Frontend requests use relative `/api/booth` URLs through the Vite proxy; participants never need the backend URL. Development Express CORS accepts LAN origins.

Device URLs, assuming port 5173:

- Device 1: `http://localhost:5173/?deviceStation=1`
- Device 2: `http://localhost:5173/?deviceStation=2`
- Device 3: `http://localhost:5173/?deviceStation=3`
- Device 4: `http://localhost:5173/?deviceStation=4`

On one computer use two separate browser profiles/windows for Devices 1 and 2. Keep the same profile and URL after refreshing: a device ID is stored per station in localStorage. Do not use multiple tabs for the same station in normal operation.

On two laptops connected to the same Wi-Fi, run the servers only on the host. Run `ipconfig` there and use its Wi-Fi IPv4 address in place of localhost on BOTH laptops, for example `http://<host-ip>:5173/?deviceStation=1` and `http://<host-ip>:5173/?deviceStation=2`. Allow the Vite port through the host's private-network firewall if prompted. Guest Wi-Fi/client isolation can prevent communication. No IP address is hardcoded in the app. Changing between localhost and the LAN URL creates a different browser storage identity; use staff recovery when changing an occupied device's origin.

## Flow and test

1. Keep Device 2 open at its waiting screen. Start and begin a mission on Device 1.
2. Complete Station 01. Its complete snapshot is persisted before handoff. The backend queues it for Station 02, updating currentStation without changing startedAt or decision/scoring data.
3. Device 2 polls, atomically claims the oldest queued mission, displays incoming for 2.5 seconds, then shows a transport placeholder with the same ID and timer.
4. Device 1 resets to Home 7 seconds after the server accepts completion, retaining the backend mission.
5. Start employee B on Device 1 while A is on Device 2. B queues without replacing A.
6. Use FINISH TEST HANDOFF on Device 2 to queue A for Station 03. Device 2 then claims B. These placeholder controls test transport only; they do not add gameplay decisions or completedStations.
7. Refresh each device and restart the backend. Assignments, queues and original timestamps should survive.

Polling is serialized at about 0.7–0.8 seconds between requests. Claims and state changes execute synchronously in one server transaction, and success is returned only after a temporary JSON file is renamed into place. Competing devices receive HTTP 409. Revision checks reject stale Station 01 snapshots; an identical retry is idempotent. Queued/completed Station 01 snapshots cannot overwrite a transferred mission.

## Persistence and recovery

Default store: `backend/data/booth-state.json` when using the workspace scripts. It is gitignored. Optional `BOOTH_STORE_FILE` can select an absolute path for isolated testing. Do not delete the store during a booth session. A process lock prevents two Node servers writing the same file. A stale lock from a terminated process is reclaimed on startup; a live owner prevents startup. This is single-process persistence, not a clustered database.

For staff recovery open `http://localhost:5173/?recovery` (or the same LAN origin). It is available only in Vite development and requires backend `BOOTH_DEV_RECOVERY=true` with NODE_ENV other than production. Look up the Mission ID, release a stuck station, then resume at the backend-recorded stage using the target browser's device ID. Devices 2–4 display that ID in development; on Device 1 obtain `localStorage.getItem('cyberMission.device.1')` in its browser console. Release retains the mission. Resume rejects a busy station and does not let staff choose an incorrect stage. Close the old device tab before replacing it.

The timer is always backend-authoritative: it accumulates only while an acknowledged gameplay view is active and pauses automatically during queue and handoff states. No development toggle or manual start/continue control changes timer state.

## Limits

- Stations 02–04 are transport placeholders, not gameplay or final results. They display the shared elapsed timer but do not yet implement station-specific expiry behavior.
- FIFO assumes employees move in order; it cannot identify a physical employee or detect someone approaching the wrong device.
- The JSON store and open development recovery API are for a trusted LAN prototype. There is no staff authentication, multi-server coordination, or production deployment configuration yet.
- Station 01 gameplay/scoring is still calculated by the existing client engine; the backend protects snapshot ordering and handoff, not against a deliberately modified client.
- Mission preparation remains local and untimed; an active mission becomes durable on its first successful sync. Do not close the browser before that acknowledgement during a network outage.

## Validation completed

- Separate browser contexts: A transfers 01 to 02, Device 1 resets after seven seconds, B starts independently and queues behind A, then A advances to 03 while B loads on 02.
- Original IDs, startedAt, decisions and hidden data preserved; Station 01 and Device 2 refresh recovery checked.
- Real displayed timer decreases during acknowledged gameplay and remains paused through handoff, queue waiting and refresh. Fullscreen and 1920x1080 / 1366x768 placeholder layouts checked.
- Explicit Exit from Station Complete returns Home immediately while retaining the queued backend mission; Cancel returns to Complete.
- Automated backend suite covers competing claims, stale revisions, duplicate requests, restart persistence, store ownership lock, staff recovery and stage preservation. Run with `npm test`; production frontend build uses `npm run build`.
- Host LAN health endpoint returned HTTP 200 at `http://192.168.100.38:5177/api/health` in this test environment. Automated Chromium blocked LAN module loading and some Vite hot-reload WebSockets under local-network access rules. Application checks on localhost passed. Two physical laptops and their firewall/browser permissions still require on-site validation.
- The original `/api/missions` scaffold remains separate and unused by booth clients. Durable booth traffic uses `/api/booth`; do not use the legacy API as a recovery interface.

## Current uncommitted file inventory

Synchronization files (including work resumed from the interrupted run):

```text
.gitignore
package.json
backend/package.json
backend/src/server.js
backend/src/routes/booth.js
backend/src/boothStoreLock.js
backend/scripts/validateBooth.mjs
frontend/vite.config.js
frontend/src/App.jsx
frontend/src/context/MissionContext.jsx
frontend/src/booth/boothApi.js
frontend/src/booth/StationOneSync.jsx
frontend/src/booth/StationDevice.jsx
frontend/src/booth/Recovery.jsx
frontend/src/booth/booth.css
docs/booth-synchronization.md
```

Earlier local visual/content changes preserved:

```text
frontend/src/pages/MissionBriefing/MissionBriefing.css
frontend/src/pages/MissionBriefing/MissionBriefing.jsx
frontend/src/data/smsScenarios.js
frontend/src/data/linkPreviews.js
frontend/src/stations/Station01/LinkInspector.jsx
frontend/src/stations/Station01/MessageDetails.jsx
frontend/src/stations/Station01/PhoneInterface.jsx
frontend/src/stations/Station01/SenderInspector.jsx
frontend/src/stations/Station01/SimulatedBrowser.jsx
frontend/src/stations/Station01/SimulatedBrowser.css
frontend/src/stations/Station01/Station01.jsx
frontend/src/utils/station01Engine.js
```
