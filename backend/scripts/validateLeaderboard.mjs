import assert from 'node:assert/strict';
import {leaderboardSnapshot} from '../src/leaderboard.js';
import {pageRows} from '../../frontend/src/pages/LiveLeaderboard/paging.mjs';
const state={missions:{}};
for(let i=0;i<35;i++){const id=`CM-LB${String(i).padStart(4,'0')}`;state.missions[id]={missionId:id,phase:'ACTIVE',mission:{playerName:i<2?'Same Name':`Participant ${i}`,avatarId:`cyber-${String(i%24+1).padStart(2,'0')}`,decisions:{answer:'secret'},evidence:['private']},scoring:{total:1000-i*10,stations:{station01:{finalizedAt:'2026-10-09T08:00:00.000Z'}}}};}
const before=JSON.stringify(state),first=leaderboardSnapshot(state).entries;
assert.equal(first.length,35);assert.equal(first.filter(e=>e.playerName==='Same Name').length,2);assert.equal(JSON.stringify(state),before);
assert.deepEqual(Object.keys(first[0]).sort(),['avatarId','completedStations','maximum','missionId','playerName','rank','score'].sort());
const fifth=first[4].missionId;state.missions[fifth].scoring.total=995;assert.equal(leaderboardSnapshot(state).entries[1].missionId,fifth);
const last=first.at(-1).missionId;state.missions[last].scoring.total=2000;state.missions[last].scoring.stations.station02={finalizedAt:'2026-10-09T08:01:00Z'};
const next=leaderboardSnapshot(state).entries;assert.equal(next[0].missionId,last);assert.equal(next[0].completedStations,2);assert.equal(next[0].avatarId,state.missions[last].mission.avatarId);assert.equal(next.length,35);
const visible=new Set();for(let i=0;i<8;i++){const page=pageRows(next,i,4);assert.deepEqual(page.top,next.slice(0,3));page.lower.forEach(e=>visible.add(e.missionId));}assert.equal(visible.size,32);
assert(!JSON.stringify(leaderboardSnapshot(state)).includes('secret'));assert(!JSON.stringify(leaderboardSnapshot(state)).includes('private'));
state.missions[last].devPreview=true;assert.equal(leaderboardSnapshot(state).entries.length,34);
state.missions[last].devPreview=false;state.missions[last].phase='DEV_ARCHIVED';assert.equal(leaderboardSnapshot(state).entries.length,34);
assert.deepEqual(leaderboardSnapshot({missions:{}}),{entries:[]});
console.log('Leaderboard PASS: private allowlist, read-only projection, 35 participants, same-name distinct missions, 5th-to-2nd and last-to-1st promotion, avatars/progress, top-three retention and complete page rotation.');
