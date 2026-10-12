# Event management

The game and the Live Leaderboard always follow the **active event**. There is no separate admin page.

## Workflow (on the Live Leaderboard page, `/?display=leaderboard`)
1. Click the small **+** button in the header.
2. Type the sector / event name. The first time (per 8 hours, per browser) also type the organizer PIN.
3. Click **Start Competition**. The event is created and activated in one transaction: the previous event is archived (nothing is deleted) and the leaderboard starts at zero.
4. Players who open the normal game link automatically join the active event; every mission is saved with that event's id in PostgreSQL.
5. **Previous Results** (header) lists earlier events and shows each one's leaderboard.

Starting is refused (HTTP 409) while any mission is in progress. Events never change by date.

## Configuration (Render -> Environment, never in Git)
- `ADMIN_PASSWORD` - the organizer PIN, at least 12 characters. Without it the (+) action is disabled.
- `ADMIN_SESSION_SECRET` - required random secret, at least 32 characters.

When `SERVE_FRONTEND=true`, startup is refused unless both variables are present and valid.

## API
- Public read-only: `GET /api/booth/leaderboard` (adds `event`), `GET /api/booth/events`, `GET /api/booth/events/:id/leaderboard` (no hidden missions, no drafts).
- Protected (`/api/admin`): `POST /login`, `POST /start`, plus `GET/POST /events...` for advanced use.

## Data
Events live inside the same PostgreSQL state document as missions (`events` key). On first start the existing 13 missions are tagged "Strategy Day / يوم الاستراتيجية" (additive, idempotent); the 3 previously excluded missions stay stored but hidden from public views.

## Security
HMAC-signed HttpOnly SameSite=Strict cookie (8 h, Secure over HTTPS), custom header + same-origin check on every change, 5 failed attempts -> 15 min lockout, server-side authorization.
