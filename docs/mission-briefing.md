# Pre-mission briefing

Home START MISSION calls `prepareMission()`. The existing localStorage session receives a Mission ID, `status: "prepared"`, and `startedAt: null`. No SMS is selected and no anti-repeat history or scoring event is recorded. Home and Briefing display the configured 480-second duration, not a live timer.

BEGIN MISSION calls `beginMission()`: the same ID becomes `active`, `startedAt` is assigned once, and the existing Station 01 engine selects the scenario. Repeated activation returns the persisted active session unchanged. The 650 ms visual transition consumes less than one second of mission time. Existing completion and timeout states remain unchanged.

Refresh restores prepared sessions to Briefing and active sessions to their existing station with the same timestamp and scenario. BACK discards only an unstarted prepared session and returns Home; active sessions cannot be discarded by this preparation operation.

For development only, set `VITE_DEV_PAUSE_MISSION_TIMER=true` in `frontend/.env.local` and restart `npm run dev`. The existing flag in `frontend/src/config/developmentConfig.js` keeps the display at 08:00 and prevents timeout after BEGIN while retaining the real startedAt for recovery. Set the flag to `false` or remove it and restart to use elapsed time from startedAt; start a fresh mission when testing the real countdown. Production always uses the real countdown, regardless of this flag. Briefing is untimed in either mode.

The lifecycle remains localStorage-backed. No shared backend, device synchronization, or new station gameplay is implemented. Station nodes describe the intended four-device experience and do not simulate connectivity.
