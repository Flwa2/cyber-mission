# Fixed-device booth pipeline

Each browser stays on its configured `deviceStation` URL. Employees move between devices; device URLs never advance with a mission.

## Existing queue and claims

The JSON-backed booth router remains the single queue system. Enqueue assigns an increasing sequence number; a station selects the oldest eligible QUEUED mission for its stage. Claim and persistence occur in the existing synchronous transaction. Busy stations reject another device; revisions protect gameplay updates. Saved decisions, evidence and mission timestamps remain per mission.

## Completion and reset

Stations 01 and 02 share `StationCompletion` and Station 01's incident-room treatment. Only completion and physical handoff instructions appear; there are no answers, scores or educational feedback. Normal resetAt is six seconds after backend acknowledgement. Rendering/network/polling adds a small delay (the browser test observed approximately 7.2 seconds from Station 01's local completion to Home).

Station 01 persists completion and queues the employee for Station 02. After its display, it detaches that local mission and returns Home for the next employee. The backend mission is retained.

Station 02 persists completion and queues the same mission for Station 03. After six seconds, its next poll releases the prior assignment and claims the oldest eligible Station 02 mission in the same transaction. If empty, it shows WAITING FOR NEXT MISSION and continues polling. An existing incoming transition precedes gameplay when a mission is claimed. Device 2 remains deviceStation=2 throughout.

## Timeout and stale devices

A gap was found: timed-out missions could occupy active slots or queues indefinitely. The router now retains their data, marks them TIMED_OUT, and skips expired queued missions. An expired mission on an assigned polling device gets the existing-style timeout message and a six-second reset. Station 01 retains its existing timeout presentation. No final-results or assessment behavior is added.

The eight-minute deadline is a cumulative active-gameplay timer. It starts only after the active station acknowledges that its gameplay view is visible, pauses automatically during completion, handoff, queue waiting and reset, and resumes only after the destination station acknowledges activation. The timer snapshot is persisted with the mission, so refreshes and reconnects preserve the remaining time.

Device assignments now use server-timed 15-second leases renewed by browser heartbeats every three seconds. Expiry cleanup runs before ownership rejection and on a one-second server sweep. Interrupted missions return to their existing FIFO position with all mission data intact. Normal six-second completion resets remain independent of leases. See [device-leases.md](device-leases.md) for refresh, recovery, Safari limitations and selective development cleanup.

## Validation

`npm test` covers FIFO across two queued missions, atomic claims/revisions, persistence/restart, decision storage, timed-out queue skipping, active timeout reset and development pause.

Separate browser contexts tested A on Station 02 while B starts and completes Station 01. B waited while A was active, then automatically loaded after A's six-second completion display. A independently reached the Station 03 placeholder. IDs, original startedAt values, and Station 02 decisions remained separate; refresh and visible timer progression were checked. Both shared completion screens were visually inspected at iPad landscape. No application runtime errors were observed.

## Physical LAN test

Use the same running frontend origin and port on both devices. Current normal server:

- Laptop: http://192.168.100.38:5173/?deviceStation=1
- iPad: http://192.168.100.38:5173/?deviceStation=2
- Optional Station 03 placeholder: http://192.168.100.38:5173/?deviceStation=3

Start A on the laptop, complete Station 01, and move to the iPad. Start B on the laptop while A works on the desk. Complete B's Station 01, then A's Station 02. The iPad should show completion for approximately six seconds and automatically receive B. The laptop remains Station 01. No employee Mission ID entry or manual refresh is required.

Keep the existing browser profile/origin on each physical device; changing origins generates a different stored device identity and may require recovery. The isolated browser test server uses port 5175 with separate test persistence; it is not the normal physical-booth store.
