import {existsSync,readFileSync} from 'node:fs';

// Event scope: missions listed here predate the current event and stay in storage but are hidden.
const EVENT_FILE=new URL('../data/leaderboard-event.json',import.meta.url);
function excludedMissionIds() {
 try {
  if(!existsSync(EVENT_FILE))return new Set();
  const ids=JSON.parse(readFileSync(EVENT_FILE,'utf8').replace(/^\uFEFF/,'')).excludedMissionIds;
  return new Set(Array.isArray(ids)?ids:[]);
 } catch { return new Set(); }
}

// Missions hidden before the event system existed (event file + cloud store scope).
export function legacyExcludedMissionIds(state) {
 const excluded=excludedMissionIds();
 // Cloud deployments keep the event scope inside the store (no local data folder).
 const stored=state.leaderboardEvent?.excludedMissionIds;
 if(Array.isArray(stored))stored.forEach(id=>excluded.add(id));
 return excluded;
}
const toEntry=r=>({
 missionId:r.missionId,playerName:r.mission.playerName,avatarId:r.mission.avatarId||null,
 score:r.scoring.total,maximum:r.scoring.maximum||5000,
 completedStations:[1,2,3,4].filter(n=>r.scoring.stations[`station0${n}`]).length,
 joinedAt:r.scoring.stations.station01.finalizedAt
});
const scored=r=>r.phase!=='ABANDONED'&&r.scoring?.stations?.station01&&typeof r.mission?.playerName==='string'&&typeof r.missionId==='string'&&Number.isFinite(r.scoring.total);
const isDev=r=>r.devPreview||r.mission?.devPreview||r.phase==='DEV_ARCHIVED';
// Ties keep the earlier Station01 finisher first, then Mission ID. No elapsed-time comparison.
const rank=entries=>entries.sort((a,b)=>b.score-a.score||a.joinedAt.localeCompare(b.joinedAt)||a.missionId.localeCompare(b.missionId)).map(({joinedAt,...entry},i)=>({...entry,rank:i+1}));
const eventOf=(state,r)=>r.eventId??state.events.legacyEventId;
// Hidden or test missions of one event: stored and shown to admins, never ranked.
export function hiddenEventMissions(state,eventId) {
 const hidden=new Set(state.events?.items?.[eventId]?.hiddenMissionIds||[]);
 return Object.values(state.missions||{}).filter(r=>eventOf(state,r)===eventId&&scored(r)&&(hidden.has(r.missionId)||isDev(r))).map(r=>{const {joinedAt,...entry}=toEntry(r);return {...entry,hidden:true};});
}

// Read-only allowlist: no mission answers, evidence, flags or private score breakdowns.
export function leaderboardSnapshot(state,eventId) {
 const scoped=Boolean(state.events?.items);
 const id=eventId??state.events?.activeEventId;
 const excluded=scoped?new Set(state.events.items[id]?.hiddenMissionIds||[]):legacyExcludedMissionIds(state);
 const entries=Object.values(state.missions||{}).filter(r=>(!scoped||eventOf(state,r)===id)&&!excluded.has(r.missionId)&&scored(r)&&!isDev(r)).map(toEntry);
 return {entries:rank(entries)};
}
