# Pre-mission briefing

Home START MISSION calls `prepareMission()`. The existing localStorage session receives a Mission ID, `status: "prepared"`, `playerName: ""`, a default `avatarId`, and `startedAt: null`. Player Setup saves the player's name (up to 40 characters) and selected avatar ID on this prepared session. The name is trimmed when the mission begins. No SMS is selected and no anti-repeat history or scoring event is recorded. Home, Player Setup, and Briefing display the configured 480-second duration, not a live timer.

Player Setup continues to the existing Briefing. Returning from Briefing to Player Setup retains the entered name and avatar. BEGIN MISSION calls `beginMission()`: a non-empty trimmed player name is required, the same ID becomes `active`, `startedAt` is assigned once, and the existing Station 01 engine selects the scenario. Repeated activation returns the persisted active session unchanged. The 650 ms visual transition consumes less than one second of mission time. Existing completion and timeout states remain unchanged.

Refresh restores prepared sessions, including the entered player name and avatar, to Player Setup and active sessions to their existing station with the same timestamp and scenario. Player Setup BACK discards only an unstarted prepared session and returns Home; active sessions cannot be discarded by this preparation operation.

The active mission uses the backend-authoritative cumulative 480-second timer. It starts after Station 01 acknowledges its gameplay view, pauses automatically during handoff and queue waiting, and resumes only after the destination station acknowledges its active gameplay view. Briefing remains untimed.

The browser stores the complete Mission Session locally. Once active, Station 01 synchronizes that session to the booth backend; the backend mission record carries `playerName` and `avatarId` unchanged through the existing Station 02, 03, and 04 handoffs.
