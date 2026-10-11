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

// Read-only allowlist: no mission answers, evidence, flags or private score breakdowns.
export function leaderboardSnapshot(state) {
 const excluded=excludedMissionIds();
 // Cloud deployments keep the event scope inside the store (no local data folder).
 const stored=state.leaderboardEvent?.excludedMissionIds;
 if(Array.isArray(stored))stored.forEach(id=>excluded.add(id));
 const entries=Object.values(state.missions||{}).filter(r=>!excluded.has(r.missionId) && r.scoring?.stations?.station01 && !r.devPreview && !r.mission?.devPreview && r.phase!=='DEV_ARCHIVED').map(r=>({
  missionId:r.missionId,playerName:r.mission.playerName,avatarId:r.mission.avatarId||null,
  score:r.scoring.total,maximum:5000,
  completedStations:[1,2,3,4].filter(n=>r.scoring.stations[`station0${n}`]).length,
  joinedAt:r.scoring.stations.station01.finalizedAt
 })).filter(e=>typeof e.missionId==='string'&&typeof e.playerName==='string'&&Number.isFinite(e.score));
 // Ties keep the earlier Station01 finisher first, then Mission ID. No elapsed-time comparison.
 entries.sort((a,b)=>b.score-a.score||a.joinedAt.localeCompare(b.joinedAt)||a.missionId.localeCompare(b.missionId));
 return {entries:entries.map(({joinedAt,...entry},i)=>({...entry,rank:i+1}))};
}
