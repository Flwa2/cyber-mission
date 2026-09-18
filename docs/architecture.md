# Architecture

Cyber Mission is built as a simple full-stack application with a React frontend and Express backend.

## Frontend Architecture

The frontend uses React and Vite with plain JavaScript.

Important areas:

- `config/` stores mission-wide settings and scoring action rules.
- `context/MissionContext.jsx` exposes the active Mission Session to screens.
- `hooks/useMissionTimer.js` calculates remaining time from `startedAt`.
- `services/missionService.js` provides the frontend mission API.
- `services/storageService.js` isolates browser persistence.
- `utils/scoringEngine.js` updates hidden score, hidden attack state, decisions, and flags.
- `utils/scenarioSelector.js` prepares branching paths for later stations.
- `stations/` holds station-specific screens.

Station components should not calculate scoring rules directly and should not read from localStorage directly.

## Backend Architecture

The backend is a minimal Express API.

Routes:

- `POST /api/missions`
- `GET /api/missions/:missionId`
- `PATCH /api/missions/:missionId`
- `GET /api/health`

Current backend storage is an in-memory `Map`. This is suitable only for early development. It resets when the process restarts.

## Mission Session

The Mission Session is the central data model for the booth experience.

It tracks:

- Mission ID
- Creation and start timestamps
- Mission status
- Current station
- Completed stations
- Hidden score
- Hidden attack state
- Evidence
- Decisions
- Branching flags

Hidden fields are available to application logic but must not be shown during Stations 01 to 04.

## Global Timer

The timer is based on the original `startedAt` timestamp.

The app calculates:

```text
elapsedTime = currentTime - startedAt
remainingTime = missionDurationSeconds - elapsedTime
```

This prevents the timer from restarting on browser refresh. Cross-device continuity still requires the shared backend integration described below.

## Hidden Game State

During individual stations, participant-facing UI must not show:

- Pass or fail
- Correct or wrong
- Cyber Score
- Attack progress
- System compromised
- Attack contained

Neutral station feedback such as `Decision Recorded`, `Evidence Collected`, or `Proceed to Next Station` is acceptable.

## Branching Decisions

Branching is handled through Mission Session flags.

Example:

```js
flags: {
  suspiciousLinkOpened: true,
  accountExposurePossible: true
}
```

Station 03 can later check `accountExposurePossible` and show account activity evidence only for affected participants.

## Future Multi-Device Communication

The backend routes are prepared so future booth devices can fetch and update the same Mission Session by Mission ID.

The intended later flow:

1. Station 01 creates or updates a mission.
2. Participant carries Mission ID or QR code to Station 02.
3. Station 02 retrieves the same mission from the backend.
4. Each station updates the shared session.
5. Station 04 completes the session.

## Station Device Status Model

The frontend now defines a reusable station status model for the future four-screen booth:

- `LOCKED`
- `WAITING`
- `READY`
- `ACTIVE`
- `COMPLETED`

This model is currently derived from the Mission Session and does not replace the existing gameplay logic. It is intended to let each physical station device render the correct state for the same Mission ID:

- Station 01 starts as `ACTIVE`.
- Later stations can wait for the previous station.
- When a station completes, the next station can become `READY`.
- Completion status is visual only and must not reveal scoring, correctness, or scenario classification.

The reusable waiting screen is a visual foundation for this future station-device behavior.

## Development Preview for Station Screens

In frontend development mode, station status screens can be previewed with URL parameters:

```text
/?stationPreview=2&status=WAITING
/?stationPreview=2&status=READY
/?stationPreview=2&status=ACTIVE
/?stationPreview=2&status=COMPLETED
```

This preview is intentionally limited to visual station state. It does not expose hidden score, answer correctness, or scenario classification.

## Required Work Before Four Real Devices Sync

The current prototype still stores the active frontend Mission Session in browser `localStorage`. That is useful for single-device development and refresh recovery, but it cannot synchronize four separate laptops.

Before real multi-device booth testing, the frontend mission service should be extended so the Express API becomes the shared source of truth:

1. Create or resume a Mission Session through `POST /api/missions` and `GET /api/missions/:missionId`.
2. Persist station updates with `PATCH /api/missions/:missionId`.
3. Add a simple sync strategy for waiting screens, starting with short polling.
4. Replace the backend in-memory store with a durable development datastore before any real booth deployment.
5. Keep `localStorage` as a fallback/cache only, not the cross-device source of truth.

## Future QR Handoff

The current `QRDisplay` component is a placeholder. Later it can render a QR code containing the Mission ID or a safe resume URL.

The QR code should not contain personal information.

## Cinematic Home

The original supplied PNG is stored unchanged at `frontend/public/assets/cyber-mission-home.png`.
`Welcome.css` renders it as a centered, full-viewport `cover` background, preserving its aspect ratio.
Artwork text is not duplicated in HTML. Only the duration HUD, start button, optional short challenge, and fullscreen control are live UI.

Home displays the configured eight-minute duration without creating a mission. Start invokes the existing MissionContext / missionService creation path once per launch, saving the ID, original startedAt, random scenario, and hidden state. A 650 ms departure overlaps the shortened Station 01 notification; the busy Home background then unmounts. The countdown uses the persisted start timestamp.

Station states are derived from the mission: ACTIVE, WAITING, WAITING, WAITING initially; COMPLETED, READY, WAITING, WAITING after Station 01. Device 1 stays on its completion screen.

Multi-device synchronization is **pending**, not simulated. For the next task, Device 2 must bind to the same backend Mission ID before Station 01 finishes, show AWAITING STATION 01, and automatically become READY using polling or a subscription. The existing development status preview is not synchronization. No Station 02 gameplay is implemented by this Home change.
