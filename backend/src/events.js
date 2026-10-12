import { randomBytes } from 'node:crypto';
import { missionTimerExpired } from './missionTimer.js';
import { hiddenEventMissions, leaderboardSnapshot, legacyExcludedMissionIds } from './leaderboard.js';

// Events live inside the same transactional store document as the missions, so switching
// the active event and checking for unfinished missions is one atomic, persisted step.
const LEGACY_NAME = process.env.LEGACY_EVENT_NAME || 'Strategy Day / يوم الاستراتيجية';
const LEGACY_DATE = process.env.LEGACY_EVENT_DATE || '2026-10-11';
const IN_PROGRESS = ['ACTIVE', 'QUEUED', 'CLAIMING', 'RECOVERY'];
const find = (state, id) => Object.hasOwn(state.events.items, id) ? state.events.items[id] : null;
const fail = (message, status = 400, extra = {}) => Object.assign(new Error(message), { status, ...extra });

// One-time, additive migration: wraps every existing mission in a first event and never edits scores.
export function ensureEvents(state) {
  if (state.events?.items && state.events.activeEventId) return false;
  const now = new Date().toISOString();
  const missionIds = Object.keys(state.missions || {});
  const id = state.leaderboardEvent?.eventId || 'event-legacy';
  const hidden = [...legacyExcludedMissionIds(state)].filter(m => missionIds.includes(m));
  state.events = {
    version: 1,
    legacyEventId: id,
    activeEventId: id,
    items: {
      [id]: {
        id, name: missionIds.length ? LEGACY_NAME : 'Cyber Mission', date: missionIds.length ? LEGACY_DATE : now.slice(0, 10), sector: '',
        status: 'active', createdAt: now, activatedAt: now, archivedAt: null, hiddenMissionIds: hidden
      }
    }
  };
  for (const record of Object.values(state.missions || {})) if (record.eventId === undefined) record.eventId = id;
  return true;
}

const unresolved = record => IN_PROGRESS.includes(record.phase) && record.phase !== 'DEV_ARCHIVED' && !record.devPreview &&
  record.mission?.status !== 'timed-out' && !missionTimerExpired(record);

export function missionsInProgress(state) {
  const blockers = Object.values(state.missions || {}).filter(unresolved)
    .map(r => ({ missionId: r.missionId, playerName: r.mission?.playerName || '', phase: r.phase, station: r.stage }));
  const ids = new Set(blockers.map(b => b.missionId));
  for (const slot of Object.values(state.stations || {})) {
    const record = slot?.missionId && state.missions?.[slot.missionId];
    if (record && ['ACTIVE', 'CLAIMING'].includes(slot.state) && unresolved(record) && !ids.has(slot.missionId)) {
      blockers.push({ missionId: slot.missionId, playerName: record.mission?.playerName || '', phase: slot.state, station: slot.station });
    }
  }
  return blockers;
}

function summary(state, event) {
  const participants = leaderboardSnapshot(state, event.id).entries.length;
  const missionCount = Object.values(state.missions || {}).filter(r => (r.eventId ?? state.events.legacyEventId) === event.id).length;
  return { id: event.id, name: event.name, date: event.date, sector: event.sector, status: event.status, createdAt: event.createdAt, activatedAt: event.activatedAt, archivedAt: event.archivedAt, participants, hiddenCount: hiddenEventMissions(state, event.id).length, missionCount, active: event.id === state.events.activeEventId };
}

export function listEvents(state) {
  const events = Object.values(state.events.items).map(e => summary(state, e))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return { activeEventId: state.events.activeEventId, events, inProgress: missionsInProgress(state).length };
}

function clean(value, max, label, required) {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (required && !text) throw fail(`${label} is required`);
  if (text.length > max) throw fail(`${label} must be ${max} characters or fewer`);
  return text;
}

export function createEvent(state, input) {
  const name = clean(input?.name, 80, 'Event name', true);
  const sector = clean(input?.sector, 60, 'Sector', false);
  const date = typeof input?.date === 'string' ? input.date : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) throw fail('Event date must be a valid YYYY-MM-DD date');
  if (Object.values(state.events.items).some(e => e.status !== 'archived' && e.name.toLowerCase() === name.toLowerCase() && e.date === date)) throw fail('An event with this name and date already exists', 409);
  const id = 'event-' + randomBytes(6).toString('hex');
  state.events.items[id] = { id, name, date, sector, status: 'draft', createdAt: new Date().toISOString(), activatedAt: null, archivedAt: null, hiddenMissionIds: [] };
  return summary(state, state.events.items[id]);
}

// Activation never edits missions: the previous event is only marked archived.
export function activateEvent(state, id) {
  const event = find(state, id);
  if (!event) throw fail('Event not found', 404);
  if (state.events.activeEventId === id) throw fail('This event is already active', 409);
  const blockers = missionsInProgress(state);
  if (blockers.length) throw fail('Missions are in progress. Wait until every player finishes before switching events.', 409, { blockers });
  const now = new Date().toISOString();
  const previous = state.events.items[state.events.activeEventId];
  if (previous) { previous.status = 'archived'; previous.archivedAt = now; }
  event.status = 'active'; event.activatedAt = now; event.archivedAt = null;
  state.events.activeEventId = id;
  return { activeEventId: id, previousEventId: previous?.id || null };
}

export function archiveEvent(state, id) {
  const event = find(state, id);
  if (!event) throw fail('Event not found', 404);
  if (state.events.activeEventId === id) throw fail('Activate another event to archive the current one', 409);
  if (event.status === 'archived') throw fail('Event is already archived', 409);
  event.status = 'archived'; event.archivedAt = new Date().toISOString();
  return summary(state, event);
}

export function eventDetails(state, id) {
  const event = find(state, id);
  if (!event) throw fail('Event not found', 404);
  return { event: summary(state, event), entries: leaderboardSnapshot(state, id).entries, hidden: hiddenEventMissions(state, id) };
}

// One-step workflow used by the leaderboard (+) button: guard first, then create + activate atomically.
export function startEvent(state, input) {
  const blockers = missionsInProgress(state);
  if (blockers.length) throw fail('Missions are in progress. Wait until every player finishes before starting a new competition.', 409, { blockers });
  const created = createEvent(state, { name: input?.name, sector: '', date: new Date().toISOString().slice(0, 10) });
  activateEvent(state, created.id);
  return summary(state, state.events.items[created.id]);
}

// Public, read-only: names, dates and counts only (no hidden missions, no private data).
export function publicEvents(state) {
  const pick = e => { const s = summary(state, e); return { id: s.id, name: s.name, date: s.date, participants: s.participants }; };
  const items = Object.values(state.events?.items || {});
  const active = items.find(e => e.id === state.events.activeEventId);
  const previous = items.filter(e => e.id !== state.events?.activeEventId && e.status !== 'draft')
    .sort((a, b) => String(b.activatedAt || b.createdAt).localeCompare(String(a.activatedAt || a.createdAt))).map(pick);
  return { active: active ? pick(active) : null, previous };
}
export function publicEventLeaderboard(state, id) {
  const event = find(state, id);
  if (!event || event.status === 'draft') throw fail('Event not found', 404);
  return { event: { id: event.id, name: event.name, date: event.date }, entries: leaderboardSnapshot(state, id).entries };
}
