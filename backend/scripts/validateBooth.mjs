import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:net';

const temp = mkdtempSync(join(tmpdir(), 'cyber-booth-test-'));
const file = join(temp, 'state.json');
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
let child;
const env = { ...process.env, PORT:String(port), BOOTH_STORE_FILE:file, BOOTH_DEV_RECOVERY:'true', NODE_ENV:'test' };
const root = fileURLToPath(new URL('../', import.meta.url));
async function start() {
  child = spawn(process.execPath, ['src/server.js'], { cwd:root, env, stdio:['ignore','pipe','pipe'], windowsHide:true });
  let log=''; child.stderr.on('data', data => log += data);
  for (let n=0;n<100;n++) {
    if (child.exitCode !== null) throw new Error(log);
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw new Error('Test server did not start: '+log);
}
async function stop() { const ended=once(child,'exit'); child.kill(); await ended; }
async function api(path, body, status=200) {
  const response = await fetch(`http://127.0.0.1:${port}/api/booth${path}`, {method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data = await response.json(); assert.equal(response.status,status,JSON.stringify(data)); return data;
}
const mission = { language:'ar', playerName:'ريم', avatarId:'cyber-03', missionId:'CM-TST001', createdAt:new Date().toISOString(), startedAt:new Date().toISOString(),status:'active',currentStation:1,completedStations:[],decisions:{station01:{scenarioId:'test',completedAt:null}},evidence:{items:['original']},flags:{inspected:true},hiddenScore:7,hiddenAttackState:{level:2} };
try {
  await start();
  await api('/stations/1/sync',{deviceId:'one',mission:{...mission,playerName:''},revision:0},400);
  await api('/stations/1/sync',{deviceId:'one',mission:{...mission,playerName:' \t '},revision:0},400);
  await api('/stations/1/sync',{deviceId:'one',mission:{...mission,playerName:'x'.repeat(41)},revision:0},400);
  await api('/stations/1/sync',{deviceId:'one',mission:{...mission,avatarId:'unknown'},revision:0},400);
  let saved = await api('/stations/1/sync',{deviceId:'one',mission,revision:0}); assert.equal(saved.revision,1);
  await api('/stations/1/sync',{deviceId:'one',mission:{...mission,playerName:'  ريم  '},revision:1});
  assert.equal(JSON.parse(readFileSync(file,'utf8')).missions[mission.missionId].mission.playerName,'ريم','backend trims and persists player name');
  assert.equal((await api('/stations/1/sync',{deviceId:'one',mission,revision:0})).revision,1,'identical retry');
  const changed=structuredClone(mission); changed.flags.details=true;
  saved=await api('/stations/1/sync',{deviceId:'one',mission:changed,revision:1}); assert.equal(saved.revision,2);
  const conflict=await api('/stations/1/sync',{deviceId:'one',mission,revision:1},409);
  const {narrativeAssignment,timer,...conflictMission}=conflict.conflict.mission;
  assert.equal(narrativeAssignment.choices.length,3);assert(!narrativeAssignment.associatedPersonId);assert.deepEqual(conflictMission,changed);
  await api('/stations/1/sync',{deviceId:'one',mission:{...changed,playerName:'Another Player'},revision:2},400);
  await api('/stations/1/sync',{deviceId:'one',mission:{...changed,avatarId:'cyber-04'},revision:2},400);
  await api('/stations/1/sync',{deviceId:'other',mission:changed,revision:2},409);
  await api('/stations/1/sync',{deviceId:'one',mission:{...changed,startedAt:new Date(Date.now()+1000).toISOString()},revision:2},409);
  const completed=structuredClone(changed);completed.completedStations=[1];completed.decisions.station01.completedAt=new Date().toISOString();
  saved=await api('/stations/1/sync',{deviceId:'one',mission:completed,revision:2});assert.equal(saved.revision,3);
  assert.equal((await api('/stations/1/release',{deviceId:'one',missionId:mission.missionId})).released,false);
  assert.equal((await api('/stations/1/release',{deviceId:'one',missionId:mission.missionId,immediate:true})).released,true);
  const before=JSON.parse(readFileSync(file,'utf8'));
  await api('/stations/1/sync',{deviceId:'one',mission,revision:1});
  assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),before,'late client cannot roll back transfer');
  const claims=await Promise.all(Array.from({length:10},async(_,i)=>{
    const response=await fetch(`http://127.0.0.1:${port}/api/booth/stations/2/poll`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:'two-'+i})});return {status:response.status,data:await response.json(),id:'two-'+i};
  }));
  assert.equal(claims.filter(x=>x.status===200).length,1);assert.equal(claims.filter(x=>x.status===409).length,9);
  const winner=claims.find(x=>x.status===200);assert.equal(winner.data.mission.currentStation,2);assert.equal(winner.data.mission.startedAt,mission.startedAt);assert.equal(winner.data.mission.playerName,'ريم');assert.equal(winner.data.mission.avatarId,'cyber-03');
  const diskBeforeRestart=readFileSync(file,'utf8'); await stop(); await start();
  assert.equal(readFileSync(file,'utf8'),diskBeforeRestart);
  const restored=await api('/stations/2/poll',{deviceId:winner.id});assert.equal(restored.mission.missionId,mission.missionId);assert.equal(restored.mission.startedAt,mission.startedAt);assert.equal(restored.mission.playerName,'ريم');assert.equal(restored.mission.avatarId,'cyber-03');assert.deepEqual(restored.mission.decisions,completed.decisions);assert.deepEqual(restored.mission.evidence,mission.evidence);assert.equal(restored.mission.hiddenScore,mission.hiddenScore);assert.deepEqual(restored.mission.hiddenAttackState,mission.hiddenAttackState);
  const duplicate=spawn(process.execPath,['src/server.js'],{cwd:root,env:{...env,PORT:String(port+1)},stdio:['ignore','ignore','pipe'],windowsHide:true});let lockError='';duplicate.stderr.on('data',data=>lockError+=data);const [exitCode]=await once(duplicate,'exit');assert.notEqual(exitCode,0);assert.match(lockError,/already in use/);
  await api('/recovery/stations/2/release',{});assert.equal((await api('/recovery/'+mission.missionId)).state,'RECOVERY');
  await api('/recovery/'+mission.missionId+'/resume',{deviceId:'replacement'});
  await api('/recovery/'+mission.missionId+'/resume',{deviceId:'another'},409);
  await new Promise(resolve=>setTimeout(resolve,2600));
  const active=await api('/stations/2/poll',{deviceId:'replacement'});assert.equal(active.device.state,'ACTIVE');assert.equal(active.mission.startedAt,mission.startedAt);
    await api('/stations/2/complete-placeholder',{deviceId:'replacement',missionId:mission.missionId},409);
  let desk=active;
  const request=payload=>api('/stations/2/desk',{deviceId:'replacement',missionId:mission.missionId,revision:desk.revision,...payload});
  await api('/stations/2/desk',{deviceId:'replacement',missionId:mission.missionId,revision:desk.revision,complete:true},400);
  desk=await request({objectId:'usb',actionId:'connect'});
  assert.equal(desk.mission.flags.unknownUsbConnected,true);
  const firstDeskRevision=desk.revision;
  desk=await request({objectId:'usb',actionId:'connect'});assert.equal(desk.revision,firstDeskRevision);
  await api('/stations/2/desk',{deviceId:'replacement',missionId:mission.missionId,revision:0,objectId:'badge',actionId:'leave'},409);
  await api('/stations/2/desk',{deviceId:'replacement',missionId:mission.missionId,revision:desk.revision,objectId:'usb',actionId:'leave'},409);
  for(const [objectId,actionId]of[['badge','leave'],['documents','secure'],['qr','scan'],['cable','leave'],['power','use']])desk=await request({objectId,actionId});
  assert.equal(Object.keys(desk.mission.decisions.station02.items).length,6);
  const deskBeforeRestart=structuredClone(desk.mission);await stop();await start();
  desk=await api('/stations/2/poll',{deviceId:'replacement'});assert.deepEqual(desk.mission,deskBeforeRestart);
  assert.equal(desk.mission.hiddenScore,mission.hiddenScore);assert.deepEqual(desk.mission.hiddenAttackState,mission.hiddenAttackState);
  assert.deepEqual(desk.mission.decisions.station01,completed.decisions.station01);
  assert.deepEqual(desk.mission.evidence.items,mission.evidence.items);assert.equal(desk.mission.evidence.station02.length,6);
  desk=await request({complete:true});assert(desk.mission.decisions.station02.completedAt);
  const finishedRevision=desk.revision;desk=await request({complete:true});assert.equal(desk.revision,finishedRevision);
  await api('/stations/2/complete-placeholder',{deviceId:'replacement',missionId:mission.missionId},409);
  const stage3=await api('/stations/3/poll',{deviceId:'three'});assert.equal(stage3.mission.currentStation,3);assert.equal(stage3.mission.playerName,'ريم');assert.equal(stage3.mission.avatarId,'cyber-03');assert.deepEqual(stage3.mission.completedStations,[1,2]);assert.deepEqual(stage3.mission.decisions.station01,completed.decisions.station01);assert.deepEqual(stage3.mission.decisions.station02,desk.mission.decisions.station02);

  // FIFO remains stable with more than one eligible employee.
  await api('/stations/2/release',{deviceId:'replacement',missionId:mission.missionId,immediate:true});
  async function queueMission(id, startedAt=new Date().toISOString(), pauseTimer=false) {
    const candidate={...structuredClone(mission),missionId:id,startedAt,completedStations:[1]};
    candidate.decisions.station01.completedAt=new Date().toISOString();
    await api('/stations/1/sync',{deviceId:'queue-origin',mission:candidate,revision:0,pauseTimer});
    await api('/stations/1/release',{deviceId:'queue-origin',missionId:id,immediate:true});
    return candidate;
  }
  await queueMission('CM-FIFO01');await queueMission('CM-FIFO02');
  assert.equal((await api('/stations/2/poll',{deviceId:'fifo-device'})).mission.missionId,'CM-FIFO01');
  assert.equal((await api('/recovery/CM-FIFO02')).state,'QUEUED');
  await api('/recovery/stations/2/release',{});
  assert.equal((await api('/stations/2/poll',{deviceId:'fifo-device'})).mission.missionId,'CM-FIFO02');
  await api('/recovery/stations/2/release',{});
  await queueMission('CM-TIME01',new Date(Date.now()-478000).toISOString());
  await queueMission('CM-PAUSE1',new Date(Date.now()-600000).toISOString(),true);
  await new Promise(resolve=>setTimeout(resolve,2700));
  const pausedClaim=await api('/stations/2/poll',{deviceId:'timeout-device'});
  assert.equal(pausedClaim.mission.missionId,'CM-TIME01');
  assert.equal(pausedClaim.mission.timer.running,false,'Queue claim must not resume the timer');
  assert.equal(pausedClaim.mission.timer.remainingSeconds,480,'Queued time must remain paused');
  await api('/recovery/stations/2/release',{});
  await queueMission('CM-TIME02',new Date(Date.now()-600000).toISOString());
  await api('/stations/2/poll',{deviceId:'timeout-device'});
  await new Promise(resolve=>setTimeout(resolve,2700));
  const activeClaim=await api('/stations/2/poll',{deviceId:'timeout-device'});
  assert.equal(activeClaim.device.state,'ACTIVE');
  const activated=await api('/stations/2/activate',{deviceId:'timeout-device',missionId:activeClaim.mission.missionId});
  assert.equal(activated.mission.timer.running,true,'Gameplay activation must resume the timer');
  await api('/recovery/stations/2/release',{});
  console.log('FIFO, queued pause, post-claim activation, automatic resume and lease release passed.');
  console.log('Booth validation passed: revision conflicts, idempotency, immutable start, 10 competing claims, restart persistence, single writer, recovery, correct-stage resume, placeholder handoff.');
} finally { if(child&&child.exitCode===null)await stop();assert.equal(temp.slice(0,join(tmpdir(),'cyber-booth-test-').length),join(tmpdir(),'cyber-booth-test-'));rmSync(temp,{recursive:true,force:true}); }
