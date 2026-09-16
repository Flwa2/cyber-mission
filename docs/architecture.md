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

This prevents the timer from restarting when a participant refreshes the browser or later moves to a different station device.

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

## Future QR Handoff

The current `QRDisplay` component is a placeholder. Later it can render a QR code containing the Mission ID or a safe resume URL.

The QR code should not contain personal information.
