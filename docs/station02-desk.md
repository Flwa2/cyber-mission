# Station 02 - The Desk

Station 02 uses `/assets/station02-desk.png`, an unchanged copy of the supplied clean desk scene. The second supplied image is only a design reference and is not shipped as interface artwork.

`shared/deskObjects.mjs` defines six image-relative hotspots, observable details and object-specific action IDs/labels. A ResizeObserver fits the original 3:2 image inside the available scene area. Hotspots are percentage positions within that exact image plane, so resizing does not drift their placement. The inspection drawer becomes narrower on iPad and hides the introductory panel while open. All item targets are 48px.

Device 2 still claims missions through the existing booth polling flow. It now renders Station02 for ACTIVE and its completion view for RESETTING. Stations 03/04 remain placeholders.

The additional POST `/api/booth/stations/2/desk` endpoint accepts an object/action or completion, with the existing device identity, mission ID and revision. It updates the stored mission inside the existing transaction/persistence mechanism. It never accepts a replacement mission snapshot from Station 02. Duplicate decisions are idempotent; changing an already recorded decision or writing a stale revision is rejected. Distinct object decisions are required for progress; merely opening the inspector does not count.

Stored data:

- `decisions.station02.items[objectId]`: objectId, actionId, recordedAt.
- `decisions.station02.startedAt`: first desk decision timestamp (not the mission timer start).
- `decisions.station02.completedAt`: successful completion timestamp.
- Hidden flags and evidence events are appended by `backend/src/station02Decisions.js` for later stations. They are not displayed in the desk UI. All simulated connect/use/scan actions only record an event.
- Existing mission ID, createdAt, original startedAt, Station 01 decisions, hiddenScore and hiddenAttackState remain intact. This iteration adds no new score weights.

After three different object decisions, REVIEW & CONTINUE opens a neutral decision summary. FINISH STATION 02 atomically records completion, adds 2 to completedStations, advances currentStation to 3 and uses the existing queue to transfer the same mission. Device 2 displays completion for seven seconds, then can claim the next employee. The Station 02 placeholder-finish endpoint is disabled; stations 03/04 retain it.

Validation: `npm test` covers the original Station 01 lifecycle and the extended backend assertions (desk decisions, duplicate/stale requests, three-decision gate, restart recovery, and Stage 03 transfer). Browser checks covered six item decisions, refresh, timer continuity, two separate employee missions, and the real Station 01 -> 02 -> 03 flow. Layouts checked at 1920x1080, 1366x768, 1024x768, 1180x820 and 1366x1024. Actual iPad Safari touch feel and artwork brightness remain for user review.

The isolated review server for this iteration uses frontend port 5174 and backend port 4022, with test-only persistence in `tmp/station02-test.json`. It does not replace the existing physical-device store. Use the same frontend origin/port on all devices:

- Station 01: http://localhost:5174/?deviceStation=1
- Station 02: http://localhost:5174/?deviceStation=2
- LAN Station 02: http://192.168.100.38:5174/?deviceStation=2

For continued real booth testing, the same Station 02 code is also available through the original running server; keep using its existing URL and browser identities to retain its sessions. Do not run two different browser profiles assigned to Station 02 against one store at once. A waiting screen means no mission is queued; complete Station 01 to supply one.
