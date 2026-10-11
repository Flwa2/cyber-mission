import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { sweepDeviceLeases, LEASE_TIMEOUT_MS } from '../src/deviceLeases.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const temp = mkdtempSync(join(tmpdir(), 'cyber-lease-test-'));
const file = join(temp, 'state.json');
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
let child;
const env = { ...process.env, PORT:String(port), BOOTH_STORE_FILE:file, BOOTH_DEV_RECOVERY:'true', NODE_ENV:'test' };
async function start(overrides={}) {
  child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...env,...overrides},stdio:['ignore','pipe','pipe'],windowsHide:true});
  let log='';child.stderr.on('data',d=>log+=d);
  for(let n=0;n<100;n++){
    if(child.exitCode!==null)throw new Error(log);
    try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}
    await sleep(50);
  }
  throw new Error('Server did not start '+log);
}
async function stop(){const ended=once(child,'exit');child.kill();await ended;}
async function api(path,body,status=200){
  const res=await fetch(`http://127.0.0.1:${port}/api/booth${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const text=await res.text();assert.equal(res.status,status,text);return res.headers.get('content-type')?.includes('json')?JSON.parse(text):text;
}
const disk=()=>JSON.parse(readFileSync(file,'utf8'));
const makeMission=id=>({language:'ar',playerName:`Player ${id}`,missionId:id,startedAt:new Date().toISOString(),status:'active',currentStation:1,completedStations:[1],decisions:{station01:{scenarioId:'test',completedAt:new Date().toISOString()}},evidence:{items:['keep']},flags:{keep:true},hiddenScore:7,hiddenAttackState:{keep:true}});
async function queue(id,language="ar"){const m={...makeMission(id),language};await api('/stations/1/sync',{deviceId:'one',mission:m,revision:0});return m;}
try{
  assert.equal(LEASE_TIMEOUT_MS,15000);
  // Old-format assignments get one persisted grace window, not perpetual grace.
  const legacy={sequence:1,missions:{A:{stage:2,phase:'ACTIVE',order:1,mission:{startedAt:'unchanged'}}},stations:{2:{station:2,state:'ACTIVE',deviceId:'old',missionId:'A'}}};
  sweepDeviceLeases(legacy,1000);assert.equal(legacy.stations[2].lastHeartbeatAt,1000);
  sweepDeviceLeases(legacy,16000);assert.equal(legacy.stations[2].state,'ACTIVE');
  sweepDeviceLeases(legacy,16001);assert.equal(legacy.stations[2].state,'IDLE');assert.equal(legacy.missions.A.phase,'QUEUED');assert.equal(legacy.missions.A.order,1);
  await start();
  const a=await queue('CM-LEASEA');
  await api('/stations/1/sync',{deviceId:'one',mission:{...a,language:'en'},revision:1},409);
  await api('/stations/1/sync',{deviceId:'one',mission:{...a,language:'fr'},revision:1},400);
  let active=await api('/stations/2/poll',{deviceId:'ipad-a'});
  await sleep(2600);active=await api('/stations/2/poll',{deviceId:'ipad-a'});
  active=await api('/stations/2/desk',{deviceId:'ipad-a',missionId:a.missionId,revision:active.revision,objectId:'usb',actionId:'leave'});
  const snapshot=structuredClone(active.mission),order=disk().missions[a.missionId].order;
  const privateSnapshot=structuredClone(disk().missions[a.missionId].mission);
  const heartbeat=await api('/stations/2/heartbeat',{deviceId:'ipad-a',missionId:a.missionId,lastHeartbeatAt:9999999999999});
  assert(Math.abs(heartbeat.lastHeartbeatAt-Date.now())<1000,'server clock only');
  assert.deepEqual((await api('/stations/2/poll',{deviceId:'ipad-a'})).mission,snapshot,'refresh keeps snapshot');
  await api('/stations/2/heartbeat',{deviceId:'intruder',missionId:a.missionId},409);
  await api('/stations/2/heartbeat',{deviceId:'ipad-a',missionId:'CM-WRONG1'},409);
  await api('/stations/2/poll',{deviceId:'ipad-b'},409);
  // Station 1 normal reset is six seconds, independent of the 15-second lease.
  await sleep(3500);
  assert.equal((await api('/stations/1/poll',{deviceId:'one'})).device.state,'IDLE');
  const b=await queue('CM-LEASEB','en');
  // Simulate browser close / Wi-Fi loss: no owner requests at all.
  await sleep(Math.max(0,heartbeat.lastHeartbeatAt+16500-Date.now()));
  const lost=disk();assert.equal(lost.stations[2].state,'IDLE','background sweep without requests');
  assert.equal(lost.missions[a.missionId].phase,'QUEUED');assert.equal(lost.missions[a.missionId].order,order);
  assert.deepEqual(lost.missions[a.missionId].mission,privateSnapshot,'all mission data including private assignment retained');
  const claims=await Promise.all(['ipad-b','ipad-c'].map(async deviceId=>{
    const res=await fetch(`http://127.0.0.1:${port}/api/booth/stations/2/poll`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId})});return {deviceId,status:res.status,data:await res.json()};
  }));
  assert.equal(claims.filter(x=>x.status===200).length,1);assert.equal(claims.filter(x=>x.status===409).length,1);
  const winner=claims.find(x=>x.status===200);assert.deepEqual(winner.data.mission,snapshot,'interrupted A precedes B');
  await api('/stations/2/heartbeat',{deviceId:'ipad-a',missionId:a.missionId},409);
  await api('/stations/2/desk',{deviceId:'ipad-a',missionId:a.missionId,revision:active.revision,objectId:'badge',actionId:'leave'},409);
  await sleep(2600);active=await api('/stations/2/poll',{deviceId:winner.deviceId});
  for(const objectId of ['badge','cable'])active=await api('/stations/2/desk',{deviceId:winner.deviceId,missionId:a.missionId,revision:active.revision,objectId,actionId:'leave'});
  const finished=await api('/stations/2/desk',{deviceId:winner.deviceId,missionId:a.missionId,revision:active.revision,complete:true});
  // Compare two authoritative server timestamps, not clocks sampled across processes.
  const resetDuration=finished.device.resetAt-Date.parse(finished.mission.updatedAt);
  assert(resetDuration>=6000&&resetDuration<6100);
  const third=await api('/stations/3/poll',{deviceId:'three'});assert.equal(third.mission.missionId,a.missionId);assert.equal(third.mission.startedAt,a.startedAt);assert.equal(third.mission.playerName,a.playerName);
  await sleep(6100);
  const next=await api('/stations/2/poll',{deviceId:winner.deviceId});assert.equal(next.mission.missionId,b.missionId);assert.equal(next.mission.language,'en');assert.equal(third.mission.language,'ar');assert.equal(next.mission.startedAt,b.startedAt);
  assert.equal(disk().missions[a.missionId].stage,3,'old completion cleanup cannot requeue A at 2');
  // Explicit cleanup refuses live assignments, archives only selected test data.
  await api('/recovery/test-cleanup',{confirm:'ARCHIVE SELECTED TEST MISSIONS',missionIds:[b.missionId],stationNumbers:[2]},409);
  await api('/recovery/stations/2/release',{});
  const savedB=disk().missions[b.missionId].mission;
  await api('/recovery/test-cleanup',{missionIds:[b.missionId],stationNumbers:[2]},400);
  await api('/recovery/test-cleanup',{confirm:'ARCHIVE SELECTED TEST MISSIONS',missionIds:[b.missionId],stationNumbers:[2]});
  assert.equal(disk().missions[b.missionId].phase,'DEV_ARCHIVED');assert.deepEqual(disk().missions[b.missionId].mission,savedB);
  // Stale cleanup must commit before rejecting an old heartbeat. Seed only isolated test store.
  await stop();const seeded=disk();seeded.stations[3].lastHeartbeatAt=Date.now()-16000;writeFileSync(file,JSON.stringify(seeded));await start();
  await api('/stations/3/heartbeat',{deviceId:'three',missionId:a.missionId},409);
  assert.equal(disk().stations[3].state,'IDLE');assert.equal(disk().missions[a.missionId].phase,'QUEUED');
  // The same lease rules recover an unfinished Station 1 without creating a new mission.
  const unfinished=makeMission('CM-FIRST1');unfinished.completedStations=[];unfinished.decisions.station01.completedAt=null;
  delete unfinished.language;
  const originalSave=await api('/stations/1/sync',{deviceId:'original-one',mission:unfinished,revision:0});
  assert.equal(disk().missions[unfinished.missionId].mission.language,'ar');unfinished.language='ar';
  const privateAssignment=disk().missions[unfinished.missionId].mission.narrativeAssignment;
  unfinished.narrativeAssignment={version:privateAssignment.version,assignedAt:privateAssignment.assignedAt,choices:privateAssignment.choices};
  await stop();const lostOne=disk();lostOne.stations[1].lastHeartbeatAt=Date.now()-16000;writeFileSync(file,JSON.stringify(lostOne));await start();
  const resumedOne=await api('/stations/1/poll',{deviceId:'replacement-one'});
  assert.equal(resumedOne.device.state,'ACTIVE');assert.deepEqual(resumedOne.mission,{...unfinished,timer:resumedOne.mission.timer});assert.equal(resumedOne.revision,originalSave.revision);
  await api('/stations/1/sync',{deviceId:'original-one',mission:unfinished,revision:originalSave.revision},409);
  await api('/stations/1/sync',{deviceId:'replacement-one',mission:unfinished,revision:originalSave.revision});
  await stop();await start({NODE_ENV:'production',BOOTH_STORAGE_DURABILITY:'persistent-volume'});
  await api('/recovery/test-cleanup',{confirm:'ARCHIVE SELECTED TEST MISSIONS',missionIds:[],stationNumbers:[]},404);
  console.log('Lease tests passed: server time, legacy grace, refresh, heartbeat loss, automatic sweep, data/FIFO preservation, competing claims, fenced old writes, six-second A/B pipeline, selective archive and production guard.');
}finally{
  if(child&&child.exitCode===null)await stop();
  assert(temp.startsWith(join(tmpdir(),'cyber-lease-test-')));rmSync(temp,{recursive:true,force:true});
}
