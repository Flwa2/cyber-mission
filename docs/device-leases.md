# Booth device leases

Devices send `POST /api/booth/stations/:station/heartbeat` approximately every
3 seconds while displaying an assigned mission. The body identifies `deviceId`
and `missionId`. Only the current owner and matching mission can renew.
The server writes its own epoch-millisecond `lastHeartbeatAt` to
`stations[stationNumber]` in the existing booth JSON store. Heartbeats do not
change mission revisions, decisions, timestamps or scoring.

An assignment expires after **more than 15 seconds** without a valid heartbeat.
The server checks leases before ownership checks on requests, and every second
even when no browsers are connected. Cleanup is committed separately so a
subsequent rejected request cannot roll it back. Pre-lease persisted assignments
receive one persisted 15-second grace window; restarting does not refresh an
existing heartbeat timestamp.

For interrupted ACTIVE/CLAIMING missions, cleanup returns the record to QUEUED
at the same station, retaining its original FIFO order. Mission ID, startedAt,
decisions, evidence, completion state, scores and revisions are unchanged.
Station 1 interrupted missions receive a queue order if they did not have one;
its next browser can load the saved mission using the existing poll/recovery path.
The single-writer transaction still selects and assigns exactly one owner.
Old device mutations and heartbeats are rejected after another device claims.

The backend-authoritative eight-minute timer accumulates only during acknowledged
active gameplay. Queue waiting, handoff, station reset and lease recovery pause
it; a lease does not extend mission time. Existing timeout checks skip expired
missions while retaining their data.

Quick refresh keeps the origin-specific localStorage device ID and the existing
assignment if the browser resumes within the grace window. Different browsers
have separate identities. Browser close/visibility events do not release a lease.
iPadOS may suspend timers in hidden tabs or while locked: after 15 seconds that
browser can lose ownership. It must reconnect and poll; it cannot displace a
fresh owner. Actual physical Safari suspension has not been automated in these
tests. Offline writes cannot be accepted; server-acknowledged data is retained.

Normal completed stations release at the existing six-second resetAt, without
waiting for lease expiry. A completed mission already queued at its next station
is never moved backwards by cleanup of the previous device.

## Development-only selective cleanup

Available only with `BOOTH_DEV_RECOVERY=true` and `NODE_ENV` other than
`production`. No participant-facing control and no automatic startup wipe.
Stop the selected test browsers first and wait at least 16 seconds. Inspect the
store/recovery status and explicitly select only test Mission IDs. Then, on the
laptop, for example (replace the example IDs):

```powershell
$testCleanup = @{
  confirm = 'ARCHIVE SELECTED TEST MISSIONS'
  missionIds = @('CM-TEST01', 'CM-TEST02')
  stationNumbers = @(1, 2)
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:5173/api/booth/recovery/test-cleanup' -ContentType 'application/json' -Body $testCleanup
```

The endpoint refuses stations with a live lease and refuses assigned missions.
Only selected QUEUED, RECOVERY or TIMED_OUT records become DEV_ARCHIVED and stop
participating in claims. Full mission snapshots and the sequence counter remain;
unselected missions and their relative FIFO order are untouched. Invalid
selections fail atomically. Archival is intentionally not mission deletion.
No cleanup was run on the live booth as part of implementation validation.

## Validation

`npm test` includes `backend/scripts/validateLeases.mjs`, which starts its own
server with a temporary JSON store. It tests server timestamps, legacy grace,
refresh, loss of all owner requests, background cleanup, competing claims, stale
writes, original queue position, full snapshot preservation, A/B handoff,
selective test archive and the production guard. No live mission is used.

Separate Chromium browser contexts also verified Station 1 heartbeat and handoff,
18 seconds of continued Station 2 renewal, refresh with the same device ID,
network loss exceeding the lease, automatic takeover by a waiting browser,
and rejection of the old browser after reconnection. Mission snapshots and
original startedAt matched; no page runtime errors were reported. This was an
isolated test server/store, not a physical iPad Safari test.
