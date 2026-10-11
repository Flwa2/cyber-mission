# Event single-device mode

The default game URL now uses one authenticated, persisted mission per browser. The same participant plays Stations 01–04 without entering the physical station queues. Browser refresh resumes that mission. Station Mode remains available with `?deviceStation=1` through `?deviceStation=4`; its existing local storage, leases, queues and version-2 Station04 scoring are retained.

## Running entry points

- Production game on the host laptop: `http://127.0.0.1:5177/`
- Shared leaderboard: `http://127.0.0.1:5177/?display=leaderboard`
- Add `&lang=en` or `&lang=ar` to the leaderboard URL.
- The production entry point serves the built frontend and proxies allowed gameplay APIs to the existing backend. It does not open the database or create another store writer. Recovery/admin endpoints and source files are not published.

`node backend/scripts/serveEvent.mjs` starts this entry point from the repository root. It requires `npm run build` first and the existing backend on port 4000. `EVENT_PORT` and `EVENT_API_TARGET` allow an isolated test host. Do not start a second backend against the live store or remove its lock.

There is no verified public URL yet. The proposed temporary SSH HTTPS tunnel through localhost.run was blocked by automatic approval review; explicit approval of that provider and the public gameplay/leaderboard surface is pending. No tunnel was started. Once approved, only the web entry point on 5177 should be forwarded, never backend port 4000. The laptop, backend, web host, tunnel and internet must remain running. Free tunnel hostnames may change; players should keep using the same origin for refresh recovery.

## Versioned Station04 change

New independent missions use response version 3: vault (maximum 600, existing hint deductions retained) then suspect identification (900). The two removed questions are:

- “Based on what you found, what would you do first?” / “بناءً على ما توصلت إليه، ما أول إجراء ستتخذه؟”
- “What would you do with the files, messages and records related to this incident?” / “كيف ستتعامل مع الملفات والرسائل والسجلات المرتبطة بهذا الحادث؟”

Station04 remains 1,500 and the game remains 5,000. Existing completed score ledgers are immutable. Older/Station Mode missions retain the three 500-point questions. New independent results show authoritative station awards and the total after completion.

## Verification

`node backend/scripts/validateIndependent.mjs` uses a separate temporary store. It tests four concurrent complete journeys, a preserved historical participant, authentication, sequential progression, timer continuity, 5,000/4,600 totals, duplicate completion, restart recovery and the shared leaderboard. No live test participants are created.

Arabic and English production-browser journeys were completed in an isolated store, including evidence collection, Station03 refresh, all three financial questions, the vault and suspect confirmation. Existing frontend/backend validations and the production build were run. The live store's 13 records and sequence were compared against the activation backup; the live leaderboard retained its 10 visible entries.

Validated activation backup: `tmp/event-activation-backup-2026-10-11T19-07-30-336Z/manifest.json`. Existing data and configuration were backed up with SHA-256 checks before activation. Public/external-network testing remains blocked until tunnel publication is approved.
