# Development UI testing

The default and production timer is always the real eight-minute countdown.

To pause the timer for UI development:

1. Copy `frontend/.env.example` to `frontend/.env.local` (ignored by Git).
2. Set `VITE_DEV_PAUSE_MISSION_TIMER=true`.
3. Restart `npm run dev`.

To disable, set it to `false` (or remove the entry), then restart Vite.
The centralized guard is `frontend/src/config/developmentConfig.js`: both Vite development mode and the exact string `true` are required. Production builds ignore the flag, even if it is supplied during the build.

While enabled, every consumer of `useMissionTimer` receives 08:00, zero elapsed countdown time, and `isExpired: false`. The interval is not started. Session creation, startedAt, scenario assignment, hidden scoring and action timestamps are unchanged. Refresh restores the same session. The pause does not revive sessions already marked timed-out before it was enabled.

Disabling resumes calculation from the original startedAt, including real time spent in UI testing; start a fresh mission to test a fresh eight-minute countdown. This is a development display/expiry override, not persisted pause/resume accounting. There is no participant control.

The exit confirmation uses a body portal and native `dialog.showModal()`. The browser top layer places it above transformed or backdrop-filtered panels and makes the rest of the document inert. Cancel is initially focused; Escape cancels; closing restores focus and scroll state. No large z-index is required.

Station Complete is a visual instruction to move to the next device. It does not launch Station 02 or synchronize devices. Those tasks remain paused.
