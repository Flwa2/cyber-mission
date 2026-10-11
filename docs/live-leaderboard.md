# Live leaderboard and global creator credit

Fifth display (no deviceStation parameter):
- Arabic: http://localhost:5173/?display=leaderboard&lang=ar
- English: http://localhost:5173/?display=leaderboard&lang=en

On another device, replace localhost with the booth server's LAN address.
The frontend selects this display before importing the mission application. It never
starts a mission, creates a device identity, claims a station or sends heartbeat calls.

GET /api/booth/leaderboard is a read-only allowlisted projection of persisted progressive
scoring records. Players appear only after a finalized Station01 award, including a zero
score. Mission ID uniquely identifies an entry. The endpoint excludes preview/archive
records and exposes only ID, display name, selected avatar, total, maximum, completed
station count and rank. It does not change the approved scoring implementation.

Confirmed cumulative score ranks descending. Ties use earlier Station01 finalization,
then Mission ID; elapsed mission time is never compared. The display polls every 1.5
seconds, retains the last confirmed snapshot on disconnection and resumes automatically.
A fresh page fetches current state. The backend must run as usual on port 4000.

Top three remain visible; lower ranks rotate every ten seconds with a viewport-sized
page and visible range. Rank changes use short position animations; reduced motion
suppresses animation. Fullscreen uses the existing fullscreenchange-aware control.

The exact original cyber-mission-home.png asset is blurred behind the sharp foreground.
CreatorCredit is mounted once at the React entry point, in both language modes, with the
exact English credit. A reserved 22px + safe-area footer keeps it below gameplay controls.

Validation: backend/scripts/validateLeaderboard.mjs plus leaderboard assertions in the
existing progressive scoring API test. Browser checks cover both languages at 1920x1080,
1366x768,1180x820,1024x768, rotation, promotion, refresh/reconnect and fullscreen API cycles.
Native physical Escape behavior remains provided by the browser; headless checks use
exitFullscreen() and verify fullscreenchange and repeated re-entry.
