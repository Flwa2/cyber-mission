import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { persistentStore } from './persistentStore.js';
import { activateEvent, archiveEvent, createEvent, deleteEvent, startEvent, ensureEvents, eventDetails, listEvents } from './events.js';

// Admin access: one secret password from the environment, a signed HttpOnly session cookie,
// and server-side checks on every route. Nothing secret ever reaches the frontend.
const COOKIE = 'cm_admin';
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const sha = value => createHash('sha256').update(value).digest();
const equal = (a, b) => timingSafeEqual(sha(a), sha(b));
const password = () => { const p = process.env.ADMIN_PASSWORD || ''; return p.length >= 12 ? p : null; };
const secret = () => { const s = process.env.ADMIN_SESSION_SECRET || ''; return s.length >= 32 ? s : null; };
const configured = () => Boolean(password() && secret());
const sign = payload => createHmac('sha256', secret()).update(payload).digest('base64url');
const failures = new Map();

export function startAdmin() { return ensureEventsInStore(); }
export function ensureEventsInStore() { return persistentStore.transaction(state => { ensureEvents(state); }); }

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim(); }
  return out;
}
function authenticated(req) {
  if (!configured()) return false;
  const [payload, signature] = (cookies(req)[COOKIE] || '').split('.');
  if (!payload || !signature || !equal(signature, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
const secure = req => process.env.NODE_ENV === 'production' || req.secure;
const cookieHeader = (req, value, maxAge) => `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;
const lockedUntil = ip => { const f = failures.get(ip); return f && f.count >= MAX_FAILURES && f.until > Date.now() ? f.until : 0; };

// Mutations must come from the dashboard itself: custom header plus same-origin check.
function sameOrigin(req, res, next) {
  if (req.method === 'GET') return next();
  const origin = req.headers.origin;
  if (req.headers['x-cyber-mission-admin'] !== '1' || (origin && new URL(origin).host !== req.headers.host)) return res.status(403).json({ error: 'Forbidden' });
  next();
}
const needAdmin = (req, res, next) => authenticated(req) ? next() : res.status(401).json({ error: 'Admin login required' });
const handle = fn => async (req, res, next) => { try { res.json(await fn(req)); } catch (e) { if (e.status) return res.status(e.status).json({ error: e.message, ...(e.blockers ? { blockers: e.blockers } : {}) }); next(e); } };

const router = Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(sameOrigin);
router.get('/session', (req, res) => res.json({ authenticated: authenticated(req), configured: configured() }));
router.post('/login', (req, res) => {
  if (!configured()) return res.status(503).json({ error: 'Admin is not configured' });
  const until = lockedUntil(req.ip);
  if (until) return res.status(429).set('Retry-After', String(Math.ceil((until - Date.now()) / 1000))).json({ error: 'Too many attempts. Try again later.' });
  const given = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!equal(given, password())) {
    const f = failures.get(req.ip);
    failures.set(req.ip, { count: (f && f.until > Date.now() ? f.count : 0) + 1, until: Date.now() + LOCKOUT_MS });
    return res.status(401).json({ error: 'Incorrect password' });
  }
  failures.delete(req.ip);
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS })).toString('base64url');
  res.set('Set-Cookie', cookieHeader(req, `${payload}.${sign(payload)}`, SESSION_MS / 1000)).json({ authenticated: true });
});
router.post('/logout', (req, res) => res.set('Set-Cookie', cookieHeader(req, '', 0)).json({ authenticated: false }));

router.use(needAdmin);
router.get('/events', handle(() => listEvents(persistentStore.read())));
router.post('/start', handle(req => persistentStore.transaction(state => startEvent(state, req.body))));
router.post('/events', handle(req => persistentStore.transaction(state => createEvent(state, req.body))));
router.get('/events/:id', handle(req => eventDetails(persistentStore.read(), req.params.id)));
router.get('/events/:id/leaderboard', handle(req => eventDetails(persistentStore.read(), req.params.id)));
router.post('/events/:id/activate', handle(req => persistentStore.transaction(state => activateEvent(state, req.params.id))));
router.post('/events/:id/archive', handle(req => persistentStore.transaction(state => archiveEvent(state, req.params.id))));
router.delete('/events/:id', handle(async req => {
  const result = await persistentStore.transaction(state => deleteEvent(state, req.params.id, req.body));
  console.error(JSON.stringify({ event: 'event-deleted', eventId: result.eventId, missionsRemoved: result.missionsRemoved }));
  return result;
}));
export default router;
