import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {scoreResponse} from '../src/progressiveScoring.js';
for(const awardAvailable of [600,500,300,50,0]){
 assert.equal(scoreResponse({version:3,associatedPersonSelection:'a'},{associatedPersonId:'a'},{discoveryAcknowledgedAt:'saved',awardAvailable}).total,900+awardAvailable);
 assert.equal(scoreResponse({version:3,associatedPersonSelection:'b'},{associatedPersonId:'a'},{discoveryAcknowledgedAt:'saved',awardAvailable}).total,awardAvailable);
}
const dir=mkdtempSync(join(tmpdir(),'cyber-independent-')),file=join(dir,'state.json');
const historical={missionId:'CM-PAST01',stage:4,phase:'COMPLETED',mission:{missionId:'CM-PAST01',playerName:'Previous participant',avatarId:'cyber-03',status:'complete',decisions:{}},scoring:{maximum:5000,total:2700,stations:Object.fromEntries([700,600,600,800].map((earned,i)=>[`station0${i+1}`,{earned,maximum:i<2?1000:1500,finalizedAt:'2026-10-10T09:00:00.000Z'}]))}};
writeFileSync(file,JSON.stringify({sequence:0,stations:{},missions:{[historical.missionId]:historical}}));
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin=`http://127.0.0.1:${port}`,sleep=ms=>new Promise(r=>setTimeout(r,ms));let child;
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'pipe',windowsHide:true});let logs='';child.stderr.on('data',x=>logs+=x);for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok)return;}catch{}await sleep(50);}throw Error(logs||'Server not ready');}
async function stop(){const done=once(child,'exit');child.kill();await done;}
const disk=()=>JSON.parse(readFileSync(file,'utf8'));
const players=Array.from({length:4},(_,i)=>({id:`CM-SOLO0${i}`,token:String(i+1).repeat(64),rev:0,stage:1,startedAt:new Date().toISOString()}));
async function request(p,action,body={},status=200,station=p.stage){const res=await fetch(`${origin}/api/booth/independent/${p.id}/${station}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({missionId:p.id,accessToken:p.token,revision:p.rev,...body})});const data=await res.json();assert.equal(res.status,status,`${action}: ${JSON.stringify(data)}`);if(res.ok){p.rev=data.revision;p.stage=data.mission.currentStation;p.mission=data.mission;}return data;}
async function leaderboard(){return (await fetch(origin+'/api/booth/leaderboard')).json();}
try{
 await start();
 await Promise.all(players.map((p,i)=>request(p,'sync',{mission:{missionId:p.id,playerName:`Concurrent ${i}`,language:i%2?'ar':'en',startedAt:p.startedAt,status:'active',currentStation:1,completedStations:[],decisions:{station01:{scenarioId:'SMS-PHISH-001',senderInspected:true,messageDetailsViewed:true,linkInspected:true,completedAt:null}},evidence:[],flags:{}}})));
 const baseline=disk();assert.equal(Object.keys(baseline.stations).length,0);assert.equal(baseline.sequence,0);
 await request({...players[0],token:'f'.repeat(64)},'poll',{},403);
 await request(players[0],'desk',{},409,2);
 await sleep(1100);
 await Promise.all(players.map(async(p,i)=>{const mission=structuredClone(p.mission);mission.decisions.station01.finalAction='report';mission.decisions.station01.linkOpened=i===1;mission.decisions.station01.completedAt=new Date().toISOString();mission.completedStations=[1];await request(p,'sync',{mission});assert.equal(p.stage,2);assert.equal(p.mission.timer.running,true);assert(p.mission.timer.remainingSeconds<480);}));
 assert.equal((await leaderboard()).entries.length,5);
 await Promise.all(players.map(async p=>{await request(p,'desk',{complete:true},400);for(const objectId of ['usb','badge','documents','cable','qr','power'])await request(p,'desk',{objectId,actionId:'report'});await request(p,'desk',{complete:true});assert.equal(p.stage,3);}));
 await Promise.all(players.map(async p=>{for(const row of disk().missions[p.id].station03Experience.rows.filter(x=>x.isIncidentRelevant)){await request(p,'investigation',{action:'inspect',itemId:row.id});await request(p,'investigation',{action:'add',itemId:row.id});}await request(p,'investigation',{action:'begin-classification'});for(const q of disk().missions[p.id].station03Experience.dataChallenge.questions)await request(p,'investigation',{action:'answer',itemId:q.id,selectedClassification:q.expectedAnswer});await request(p,'investigation',{action:'complete'});assert.equal(p.stage,4);}));
 const beforeRestart=disk();await stop();await start();
 await Promise.all(players.map(async p=>{await request(p,'poll');assert.deepEqual(disk().missions[p.id].scoring,beforeRestart.missions[p.id].scoring);const record=disk().missions[p.id];assert(!JSON.stringify(p.mission).includes('expectedAnswer'));await request(p,'resolution',{action:'vault-attempt',code:record.vaultAssignment.code,requestId:`${p.id}-unlock`});await request(p,'resolution',{action:'vault-continue',requestId:`${p.id}-continue`});assert.equal(p.mission.decisions.station04.version,3);await request(p,'resolution',{action:'select-response',phase:'person',selection:record.mission.narrativeAssignment.associatedPersonId});await request(p,'resolution',{action:'advance-response'});assert.equal(p.mission.status,'complete');assert.equal(p.mission.startedAt,p.startedAt);}));
 const complete=disk();assert.equal(Object.keys(complete.stations).length,0);assert.equal(complete.sequence,0);
 for(const [i,p] of players.entries()){assert.equal(complete.missions[p.id].scoring.total,i===1?4600:5000);assert.equal(p.mission.finalScore.total,i===1?4600:5000);assert.equal(Object.keys(complete.missions[p.id].scoring.stations).length,4);await request(p,'resolution',{action:'submit-response',revision:0});assert.deepEqual(disk().missions[p.id].scoring,complete.missions[p.id].scoring);}
 await request(players[0],'resolution',{action:'advance-response',revision:0});
 assert.deepEqual(disk().missions[historical.missionId],{...historical,eventId:'event-legacy'},'existing completed record remains unchanged apart from its event tag');
 for(const p of players)assert(disk().missions[p.id].timer.activeMs>=1000,'timer did not restart at handoff');
 const entries=(await leaderboard()).entries;assert.equal(entries.length,5);assert.equal(new Set(entries.map(x=>x.missionId)).size,5);assert(entries.every(x=>x.completedStations===4&&x.score<=5000));
 await stop();await start();assert.deepEqual((await leaderboard()).entries,entries);
 console.log('PASS: four concurrent complete independent journeys; authenticated isolation; strict progression; 8-minute continuous timer; 5000/4600 totals; exactly-once awards; restart and leaderboard recovery; booth slots and FIFO sequence unchanged. Store:',file);
}finally{if(child?.exitCode===null)await stop();}
