import { independentContext, independentMiddleware, scopedTransaction } from '../independentMode.js';
import {leaderboardSnapshot} from '../leaderboard.js';
import {publicEvents,publicEventLeaderboard} from '../events.js';
import { finalizeStationScore } from '../progressiveScoring.js';
import { initializeVaultAssignment,recordVaultAction,isVaultReplay } from '../station04Vault.js';
import { assignCase, publicMission, caseCatalog } from '../caseEngine.js';
import { recordIncidentResponse } from '../station04Response.js';
import { ensureNarrativeAssignment } from '../narrativeAssignment.js';
import { Router } from 'express';
import { persistentStore } from '../persistentStore.js';
import { releaseDevice, renewLease, sweepDeviceLeases } from '../deviceLeases.js';
import { normalizeLanguage } from '../../../shared/language.mjs';
import { PLAYER_AVATAR_IDS } from '../../../shared/playerAvatars.mjs';
import { recordDeskDecision } from '../station02Decisions.js';
import { recordInvestigation } from '../station03Investigation.js';
import { ensureStation03Experience } from '../station03Experience.js';
import { DESK_OBJECTS, MIN_DESK_DECISIONS } from '../../../shared/deskObjects.mjs';
import { missionTimerExpired, missionTimerSnapshot, pauseMissionTimer, resumeMissionTimer } from '../missionTimer.js';

const router = Router();
const fail = (message, status=409) => { const e=new Error(message); e.status=status; throw e; };
const slot = (s,n) => s.stations[n] ||= { station:n, state:'IDLE', deviceId:null, missionId:null };
const enqueue = (s,r,n) => { if(independentContext.getStore()){r.stage=n;r.mission.currentStation=n;r.phase='ACTIVE';s.stations[n]={station:n,state:'ACTIVE',deviceId:r.originDevice,missionId:r.missionId};resumeMissionTimer(r);if(n===3)ensureStation03Experience(r,caseCatalog(r));return;} r.stage=n; r.mission.currentStation=n; r.phase='QUEUED'; r.order=++s.sequence; r.queuedAt=new Date().toISOString(); };
const expired = r => r.mission.status==='timed-out' || missionTimerExpired(r);
function expireRecord(r) {
 r.phase='TIMED_OUT';r.mission.status='timed-out';r.mission.updatedAt=new Date().toISOString();r.revision=(r.revision||0)+1;
}
const transaction = fn => scopedTransaction(persistentStore,fn);
function input(req) {
 const station=Number(req.params.station),deviceId=req.body.deviceId;
 if(!Number.isInteger(station)||station<1||station>4||typeof deviceId!=='string'||!deviceId||deviceId.length>100)fail('Invalid station or device',400);
 return {station,deviceId};
}
function release(s,d) { releaseDevice(d); }
function revisionCheck(r,d,revision) {
 if(revision===(r.revision||0))return;
 const e=new Error('Mission updated. Please review and try again.');e.status=409;
 e.conflict={device:d,mission:publicMission(r),revision:r.revision||0};throw e;
}
function owned(d,id) { if(d.deviceId && d.deviceId!==id)fail('Station is assigned to another device'); }
const handle=fn=>async(req,res,next)=>{try{res.json(await fn(req));}catch(e){next(e);}};
// Read-only display bypasses lease maintenance and never claims a station.
router.get('/leaderboard',(req,res)=>{const s=persistentStore.read();res.set('Cache-Control','no-store').json({...leaderboardSnapshot(s),event:publicEvents(s).active});});
router.get('/events',(req,res)=>res.set('Cache-Control','no-store').json(publicEvents(persistentStore.read())));
router.get('/events/:id/leaderboard',(req,res,next)=>{try{res.set('Cache-Control','no-store').json(publicEventLeaderboard(persistentStore.read(),req.params.id));}catch(e){e.status?res.status(e.status).json({error:e.message}):next(e);}});
router.post('/independent/:id/:station/:action',independentMiddleware(persistentStore,publicMission));
// Cleanup commits even when the following request is rejected. Also runs when
// every browser is offline; no unload event or competing poll is required.
router.use(async(req,res,next)=>{try{if(!independentContext.getStore())await transaction(s=>sweepDeviceLeases(s));next();}catch(e){next(e);}});
setInterval(async()=>{try{await transaction(s=>sweepDeviceLeases(s));}catch(e){console.error('Device lease cleanup failed:',e.message);}},1000).unref();
router.post('/stations/:station/heartbeat',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);
 owned(d,deviceId);
 if(!d.deviceId||d.missionId!==req.body.missionId)fail('Device lease is no longer assigned');
 renewLease(d);
 return {lastHeartbeatAt:d.lastHeartbeatAt};
})));
router.post('/stations/:station/sync',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req); if(station!==1)fail('Only Station 01 publishes gameplay',400);
 const incoming=req.body.mission; if(!incoming||!/^CM-[A-Z0-9]{6}$/.test(incoming.missionId)||!incoming.startedAt||!Number.isFinite(Date.parse(incoming.startedAt))||!incoming.decisions?.station01)fail('Invalid active mission',400);
 const playerName=typeof incoming.playerName==='string'?incoming.playerName.trim():'';
 if(!playerName||playerName.length>40)fail('Player name is required and must be 40 characters or fewer',400);
 if(incoming.avatarId!==undefined&&!PLAYER_AVATAR_IDS.includes(incoming.avatarId))fail('Invalid player avatar',400);
 if(incoming.language!==undefined&&!['ar','en'].includes(incoming.language))fail('Unsupported mission language',400);
 const m={...incoming,playerName,language:normalizeLanguage(incoming.language)};
 // Case assignment/content/results are server-owned, never accepted from a Station 01 snapshot.
 delete m.scoring;delete m.scoreBreakdown;
 delete m.station04Result;
 delete m.vaultAssignment;
 delete m.vault;delete m.vaultState;
 delete m.caseId;delete m.caseFile;delete m.caseResult;delete m.narrativeAssignment;
 const d=slot(s,1); let r=s.missions[m.missionId];
 const existingRecord=Boolean(r);
 // Preserve recorded inspections/exposure across stale local snapshots. Never infer event order.
 if(r?.mission.decisions.station01){
  const prior=r.mission.decisions.station01;
  if(prior.scenarioId!==m.decisions.station01.scenarioId)fail('Mission scenario cannot change');
  m.decisions=structuredClone(m.decisions);
  for(const flag of ['linkOpened','senderInspected','linkInspected','messageDetailsViewed'])if(prior[flag]===true)m.decisions.station01[flag]=true;
 }
 // Later-station decisions are owned by their backend handlers, not the Station 01 client.
 m.decisions={station01:m.decisions.station01};
 if(r?.mission.narrativeAssignment)m.narrativeAssignment=structuredClone(r.mission.narrativeAssignment);
 if(r&&normalizeLanguage(r.mission.language)!==m.language)fail('Mission language cannot change after starting');
 if(r&&r.mission.playerName!==m.playerName)fail('Player name cannot change after starting',400);
 if(r?.mission.avatarId!==undefined&&r.mission.avatarId!==m.avatarId)fail('Player avatar cannot change after starting',400);
 if(r && r.originDevice!==deviceId)fail('Mission belongs to another device');
 if(r?.phase==='TIMED_OUT')return {saved:true,resetAt:r.handoffResetAt,missionId:m.missionId,revision:r.revision,mission:publicMission(r)};
 if(r?.phase==='RECOVERY')fail('Mission requires staff recovery');
 if(r?.phase==='DEV_ARCHIVED')fail('Test mission was archived');
 if(r && r.stage!==1) return {saved:true,resetAt:r.handoffResetAt,missionId:m.missionId,revision:r.revision||0,mission:publicMission(r)};
 owned(d,deviceId); if(d.missionId&&d.missionId!==m.missionId)fail('Station already has an active mission');
 const waiting=Object.values(s.missions).filter(x=>x.stage===1&&x.phase==='QUEUED').sort((a,b)=>a.order-b.order)[0];
 if(waiting&&waiting.missionId!==m.missionId)fail('Station has an interrupted mission waiting');
 if(r && r.mission.startedAt!==m.startedAt)fail('Mission start cannot change');
 const unchanged=r && JSON.stringify({...r.mission,language:normalizeLanguage(r.mission.language)})===JSON.stringify(m);
 if(!unchanged && (req.body.revision??0)!==(r?.revision||0)) {
   const e=new Error('A newer mission is saved on the server'); e.status=409;
   e.conflict={mission:publicMission(r),revision:r.revision||0}; throw e;
 }
 r ||= s.missions[m.missionId]={missionId:m.missionId,eventId:s.events?.activeEventId,originDevice:deviceId,stage:1,phase:'ACTIVE',timer:{activeMs:0,activeStartedAt:null}};
 if(!unchanged)r.revision=(r.revision||0)+1;
 if(!r.timer)r.timer={activeMs:0,activeStartedAt:null};
 r.mission=structuredClone(m);
 assignCase(s,r);
 ensureNarrativeAssignment(r,{legacy:existingRecord});
 initializeVaultAssignment(r,{newMission:!existingRecord&&Boolean(r.caseAssignment)});
 if(!d.deviceId)renewLease(d);
 r.phase='ACTIVE';Object.assign(d,{state:'ACTIVE',deviceId,missionId:m.missionId});
 if(expired(r)){expireRecord(r);r.handoffResetAt=Date.now()+6000;Object.assign(d,{state:'RESETTING',resetAt:r.handoffResetAt});}
 else if(m.decisions.station01.completedAt){ pauseMissionTimer(r); finalizeStationScore(r,1); enqueue(s,r,2); r.handoffResetAt=Date.now()+6000; Object.assign(d,{state:'RESETTING',resetAt:r.handoffResetAt}); }
 return {saved:true,resetAt:r.handoffResetAt||null,missionId:m.missionId,revision:r.revision,mission:publicMission(r)};
})));
router.post('/stations/:station/poll',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req); const d=slot(s,station); owned(d,deviceId);
 if(d.state==='RESETTING'&&Date.now()>=d.resetAt)release(s,d);
 // Follow the current development toggle; production never honors a persisted pause.
 // Expired queued missions are retained, but no longer eligible to occupy a device.
 for(const queued of Object.values(s.missions))if(queued.stage===station&&queued.phase==='QUEUED'&&expired(queued))expireRecord(queued);
 const assigned=s.missions[d.missionId];
 if(assigned&&assigned.stage===station&&assigned.phase!=='COMPLETED'&&['ACTIVE','CLAIMING'].includes(d.state)&&expired(assigned)){
   expireRecord(assigned);Object.assign(d,{state:'RESETTING',resetAt:Date.now()+6000});
   if(station===1)assigned.handoffResetAt=d.resetAt;
 }
 if(d.state==='IDLE'){
   const r=Object.values(s.missions).filter(r=>r.stage===station&&r.phase==='QUEUED').sort((a,b)=>a.order-b.order)[0];
   if(r){r.phase=station===1?'ACTIVE':'CLAIMING';r.claimedBy=deviceId;r.incomingUntil=Date.now()+2500;if(station===1)r.originDevice=deviceId;Object.assign(d,{state:r.phase,deviceId,missionId:r.missionId});renewLease(d);}
 }
 const r=s.missions[d.missionId];
 if(r&&!r.mission.narrativeAssignment){ensureNarrativeAssignment(r);r.revision=(r.revision||0)+1;}
 if(d.state==='CLAIMING'&&Date.now()>=r.incomingUntil){d.state='ACTIVE';r.phase='ACTIVE';}
 if(r?.stage===3)ensureStation03Experience(r,caseCatalog(r));
 return {device:d,mission:publicMission(r),revision:r?.revision||0};
})));
router.post('/stations/:station/activate',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(!d.missionId||d.missionId!==req.body.missionId||d.state!=='ACTIVE')fail('Station is not active',409);
 const r=s.missions[d.missionId];
 if(!r||r.stage!==station||r.phase!=='ACTIVE')fail('Mission is not active',409);
 if(expired(r)){expireRecord(r);pauseMissionTimer(r);d.state='RESETTING';d.resetAt=Date.now()+6000;}
 else resumeMissionTimer(r);
 return {device:d,mission:publicMission(r),revision:r.revision||0};
})));
router.post('/stations/:station/release',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(d.missionId!==req.body.missionId) return {released:false};
 if(d.state==='RESETTING'&&Date.now()<d.resetAt&&req.body.immediate!==true)return {released:false};
 const r=s.missions[d.missionId];
 if(r&&r.stage===station&&r.phase==='ACTIVE'){pauseMissionTimer(r);r.phase='RECOVERY';}
 release(s,d);return {released:true};
})));
router.post('/stations/:station/desk',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(station!==2||d.missionId!==req.body.missionId)fail('No matching desk mission');
 const r=s.missions[d.missionId],{objectId,actionId,complete}=req.body;
 const response=()=>({device:d,mission:publicMission(r),revision:r.revision||0});
 if(complete&&d.state==='RESETTING'&&r.mission.decisions.station02?.completedAt)return response();
 if(d.state!=='ACTIVE'||r.stage!==2||r.phase!=='ACTIVE')fail('Desk is not active');
 if(expired(r))fail('Mission time expired');
 const prior=r.mission.decisions.station02?.items?.[objectId];
 if(!complete&&prior){if(prior.actionId!==actionId)fail('Decision already recorded');return response();}
 revisionCheck(r,d,req.body.revision);
 const now=new Date().toISOString();
 if(complete){
   const desk=r.mission.decisions.station02;
   if(Object.keys(desk?.items||{}).length<MIN_DESK_DECISIONS)fail('Record at least three item decisions',400);
   desk.completedAt=now;
   finalizeStationScore(r,2);
   r.mission.completedStations=[...new Set([...r.mission.completedStations,2])];
   r.mission.updatedAt=now;pauseMissionTimer(r);enqueue(s,r,3);
   Object.assign(d,{state:'RESETTING',resetAt:Date.now()+6000});
 }else{
   if(!DESK_OBJECTS.find(item=>item.id===objectId)?.actions.some(([id])=>id===actionId))fail('Unknown desk action',400);
   recordDeskDecision(r.mission,objectId,actionId,now);
 }
 r.revision=(r.revision||0)+1;return response();
})));
router.post('/stations/:station/investigation',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(station!==3||d.missionId!==req.body.missionId)fail('No matching investigation mission');
 const r=s.missions[d.missionId],{action,itemId}=req.body;
 const response=()=>({device:d,mission:publicMission(r),revision:r.revision||0});
 if(action==='complete'&&d.state==='RESETTING'&&r.mission.decisions.station03?.completedAt)return response();
 if(d.state!=='ACTIVE'||r.stage!==3||r.phase!=='ACTIVE')fail('Investigation is not active');
 if(expired(r))fail('Mission time expired');
 revisionCheck(r,d,req.body.revision);
 ensureStation03Experience(r,caseCatalog(r));
 try{recordInvestigation(r.mission,action,itemId,new Date().toISOString(),r.station03Experience.rows,req.body.selectedClassification,r.station03Experience);}catch(e){fail(e.message,400);}
 if(action==='complete'){
   finalizeStationScore(r,3);
   r.mission.completedStations=[...new Set([...r.mission.completedStations,3])];
   pauseMissionTimer(r);enqueue(s,r,4);Object.assign(d,{state:'RESETTING',resetAt:Date.now()+6000});
 }
 r.revision=(r.revision||0)+1;return response();
})));
router.post('/stations/:station/resolution',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(station!==4||d.missionId!==req.body.missionId)fail('No matching case mission');
 const r=s.missions[d.missionId],response=()=>({device:d,mission:publicMission(r),revision:r.revision||0});
 const vaultAction=['vault-attempt','vault-hint','vault-continue'].includes(req.body.action);
 if(vaultAction){try{if(isVaultReplay(r,req.body))return response();}catch(e){fail(e.message,400);}}
 if(r.phase==='COMPLETED'){
  if(req.body.action==='finish'&&d.state!=='RESETTING')Object.assign(d,{state:'RESETTING',resetAt:Date.now()+6000});
  if(['submit','submit-response','finish'].includes(req.body.action)||(r.mode==='independent-v1'&&req.body.action==='advance-response'))return response();
  fail('Case already submitted');
 }
 if(d.state!=='ACTIVE'||r.stage!==4||r.phase!=='ACTIVE')fail('Case is not active');
 if(expired(r))fail('Mission time expired');
 revisionCheck(r,d,req.body.revision);
 try{
  ensureNarrativeAssignment(r);
  if(vaultAction){
   recordVaultAction(r,req.body);
   if(req.body.action==='vault-continue'&&!r.mission.decisions.station04)recordIncidentResponse(r,{action:'begin-response'});
  }else recordIncidentResponse(r,req.body);
 }catch(e){fail(e.message,400);}
 if(r.phase==='COMPLETED'){pauseMissionTimer(r);finalizeStationScore(r,4);Object.assign(d,{state:'RESETTING',resetAt:Date.now()+6000});}
 r.revision=(r.revision||0)+1;return response();
})));
router.post('/stations/:station/complete-placeholder',handle(req=>transaction(s=>{
 const {station,deviceId}=input(req),d=slot(s,station);owned(d,deviceId);
 if(station!==4||d.state!=='ACTIVE'||d.missionId!==req.body.missionId)fail('No matching active placeholder');
 const r=s.missions[d.missionId];
 if(r.caseAssignment)fail('Use case resolution to complete this mission');
 // Transport test only: do not invent gameplay decisions, scores, or completedStations.
 (r.transportHistory ||= []).push({station,at:new Date().toISOString(),kind:'placeholder-handoff'});
 if(station<4)enqueue(s,r,station+1); else r.phase='COMPLETED';
 d.state='RESETTING';d.resetAt=Date.now()+1000;return {device:d};
})));
router.use('/recovery',(req,res,next)=>{if(process.env.BOOTH_DEV_RECOVERY!=='true'||process.env.NODE_ENV==='production')return res.sendStatus(404);next();});
router.get('/recovery/:id',handle(req=>{
 const state=persistentStore.read();
 const r=state.missions[req.params.id];if(!r)fail('Mission not found',404);
 return {missionId:r.missionId,station:r.stage,state:r.phase,queuePosition:r.phase==='QUEUED'?Object.values(state.missions).filter(x=>x.stage===r.stage&&x.phase==='QUEUED'&&x.order<=r.order).length:null,device:state.stations[r.stage]||null};
}));
router.post('/recovery/:id/resume',handle(req=>transaction(s=>{
 const r=s.missions[req.params.id];if(!r)fail('Mission not found',404);
 if(!['QUEUED','RECOVERY'].includes(r.phase))fail('Release the active station first');
 const d=slot(s,r.stage);if(d.state!=='IDLE')fail('Correct station is busy');
 if(typeof req.body.deviceId!=='string'||!req.body.deviceId)fail('Target device ID is required',400);
 r.phase=r.stage===1?'ACTIVE':'CLAIMING';r.claimedBy=req.body.deviceId;r.incomingUntil=Date.now()+2500;
 if(r.stage===1)r.originDevice=req.body.deviceId;
 Object.assign(d,{state:r.phase,deviceId:req.body.deviceId,missionId:r.missionId});renewLease(d);return {station:r.stage,state:r.phase};
})));
router.post('/recovery/stations/:station/release',handle(req=>transaction(s=>{
 const station=Number(req.params.station);if(![1,2,3,4].includes(station))fail('Invalid station',400);
 const d=slot(s,station),r=s.missions[d.missionId];
 if(r&&r.stage===station&&['ACTIVE','CLAIMING'].includes(r.phase))r.phase='RECOVERY';
 release(s,d);return {released:true};
})));
// Explicit staff-only development cleanup. Archive rather than delete snapshots.
router.post('/recovery/test-cleanup',handle(req=>transaction(s=>{
 const {confirm,missionIds,stationNumbers}=req.body;
 if(confirm!=='ARCHIVE SELECTED TEST MISSIONS'||!Array.isArray(missionIds)||!Array.isArray(stationNumbers))fail('Explicit test cleanup selection required',400);
 for(const n of stationNumbers){if(![1,2,3,4].includes(n))fail('Invalid station',400);if(slot(s,n).deviceId)fail('Station still has a live lease');}
 for(const id of missionIds){const r=s.missions[id];if(!r||!['QUEUED','RECOVERY','TIMED_OUT'].includes(r.phase)||Object.values(s.stations).some(d=>d.missionId===id))fail('Only unassigned queued, recovery or timed-out test missions may be archived');}
 for(const n of stationNumbers)release(s,slot(s,n));
 for(const id of missionIds){s.missions[id].phase='DEV_ARCHIVED';s.missions[id].archivedAt=new Date().toISOString();}
 return {archived:missionIds,released:stationNumbers};
})));
router.use((err,req,res,next)=>res.status(err.status||500).json({error:err.status?err.message:'Unable to persist booth state',conflict:err.conflict}));
export default router;
