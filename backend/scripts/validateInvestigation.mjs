import assert from 'node:assert/strict';
import {buildInvestigation,participantRecords} from '../../shared/station03Content.mjs';
import {recordInvestigation} from '../src/station03Investigation.js';
import {spawn} from 'node:child_process';import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';import {createServer} from 'node:net';import {fileURLToPath} from 'node:url';
const now=new Date().toISOString();
const make=(id,language='ar')=>({missionId:id,language,startedAt:now,status:'active',currentStation:3,completedStations:[1,2],hiddenScore:7,hiddenAttackState:2,flags:{},decisions:{station01:{completedAt:now,linkOpened:false},station02:{completedAt:now,items:{}}},evidence:[{id:'prior',station:2}]});
const a=make('CM-INV001'),b=make('CM-INV002','en');
a.decisions.station01.linkOpened=true;a.decisions.station01.link={destination:'https://support-check.example.net/review'};a.flags.suspiciousLinkOpened=true;a.decisions.station02.items.usb={actionId:'connect',recordedAt:now};
const content=buildInvestigation(a);assert(content.some(x=>x.id==='s03:usb'));assert(content.some(x=>x.id==='s03:navigation'));assert(!buildInvestigation(b).some(x=>x.id==='s03:usb'||x.id==='s03:navigation'));assert.deepEqual(buildInvestigation(a),content);
for(const actionId of ['report','leave']){const m=structuredClone(a);m.decisions.station02.items.usb.actionId=actionId;assert(!buildInvestigation(m).some(x=>x.id==='s03:usb'));}
for(const key of ['linkOpened','flag']){const m=structuredClone(a);if(key==='flag')m.flags.suspiciousLinkOpened=false;else m.decisions.station01.linkOpened=false;assert(!buildInvestigation(m).some(x=>x.id==='s03:navigation'));}
assert(participantRecords(a).every(x=>!('isIncidentRelevant'in x)&&!('relatedDecision'in x)));
for(const [id,from,url]of[
 ['s03:stc-account-update','support@stc-account-update.invalid','https://account-stc-update.invalid/profile'],
 ['s03:alrajhi-verification','security@alrajhi-account-check.invalid','https://alrajhi-verify.invalid/activity'],
 ['s03:workplace-coordination','workplace.services@environment-fund.invalid',undefined]
]){
 const email=content.find(item=>item.id===id);assert(email);assert.equal(email.type,'mail');assert.equal(email.metadata.from,from);assert.equal(email.evidenceEligible,false);
 assert(!email.metadata.from.includes('example'));
 assert(email.metadata.from.endsWith('.invalid'));
 if(url){assert.equal(email.metadata.url,url);assert(!email.metadata.url.includes('example'));assert(new URL(email.metadata.url).hostname.endsWith('.invalid'));}
 const mailMission=structuredClone(a);recordInvestigation(mailMission,'inspect',id,now,content);assert.throws(()=>recordInvestigation(mailMission,'add',id,now,content),/not eligible/);assert.deepEqual(mailMission.decisions.station03.selectedIds,[]);
}
const unit=structuredClone(a);assert.throws(()=>recordInvestigation(unit,'add','s03:meeting',now));recordInvestigation(unit,'inspect','s03:meeting',now);recordInvestigation(unit,'add','s03:meeting',now);recordInvestigation(unit,'add','s03:meeting',now);assert.equal(unit.evidence.length,2);assert.equal(unit.evidence[1].isIncidentRelevant,false);assert.deepEqual(unit.evidence[1].description,content.find(item=>item.id==='s03:meeting').description);recordInvestigation(unit,'remove','s03:meeting',now);assert.deepEqual(unit.evidence,a.evidence);assert.deepEqual(unit.decisions.station01,a.decisions.station01);assert.equal(unit.hiddenScore,7);
const legacy={...structuredClone(a),evidence:{keep:['old']}};recordInvestigation(legacy,'inspect','s03:session',now);recordInvestigation(legacy,'add','s03:session',now);assert.deepEqual(legacy.evidence.keep,['old']);assert.equal(legacy.evidence.station03.length,1);
const temp=mkdtempSync(join(tmpdir(),'cyber-investigation-')),file=join(temp,'state.json');const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
writeFileSync(file,JSON.stringify({sequence:2,stations:{},missions:Object.fromEntries([a,b].map((mission,index)=>[mission.missionId,{missionId:mission.missionId,mission,stage:3,phase:'QUEUED',order:index+1,revision:0}]))}));
let child;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'ignore',windowsHide:true});for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}await sleep(100);}throw Error('server startup');}
async function stop(){const done=once(child,'exit');child.kill();await done;}
async function api(station,action,body,status=200){const r=await fetch(`http://127.0.0.1:${port}/api/booth/stations/${station}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
try{await start();let snap=await api(3,'poll',{deviceId:'three'});assert.equal(snap.mission.missionId,a.missionId);await sleep(2600);snap=await api(3,'poll',{deviceId:'three'});
 const act=async(action,itemId,extra={},status=200)=>api(3,'investigation',{deviceId:'three',missionId:a.missionId,revision:snap.revision,action,itemId,...extra},status);
 await act('add','s03:meeting',{},400);await act('inspect','s03:session',{deviceId:'other'},409);await act('inspect','s03:session',{missionId:b.missionId},409);await act('inspect','s03:missing',{},400);
 snap=await act('inspect','s03:session');await act('add','s03:session',{revision:0},409);snap=await act('add','s03:session');snap=await act('inspect','s03:meeting');snap=await act('add','s03:meeting');snap=await act('remove','s03:meeting');const saved=structuredClone(snap.mission);await stop();await start();snap=await api(3,'poll',{deviceId:'three'});assert.deepEqual(snap.mission,saved);
 // Allow the actual lease to expire, then recover before B without resetting any mission data.
 await sleep(16000);snap=await api(3,'poll',{deviceId:'replacement'});assert.deepEqual(snap.mission,saved);assert.equal(snap.mission.language,'ar');await sleep(2600);snap=await api(3,'poll',{deviceId:'replacement'});
 await api(3,'complete-placeholder',{deviceId:'replacement',missionId:a.missionId},409);
 for(const id of snap.mission.station03Experience.requiredDocumentIds)snap=await act('inspect',id,{deviceId:'replacement'});
 snap=await act('begin-classification',undefined,{deviceId:'replacement'});
 const questions=snap.mission.station03Experience.dataChallenge.questions;
 for(const [index,question]of questions.entries()){
  const answers=['public','data-management-office','contact-data-management-office'];
  snap=await act('answer',question.id,{deviceId:'replacement',selectedClassification:answers[index]});
 }
 snap=await act('complete',undefined,{deviceId:'replacement'});assert.deepEqual(snap.mission.completedStations,[1,2,3]);assert.equal(snap.mission.currentStation,4);assert.equal(snap.mission.startedAt,now);assert.equal(snap.mission.hiddenScore,7);assert.deepEqual(snap.mission.decisions.station01,a.decisions.station01);assert.deepEqual(snap.mission.decisions.station02,a.decisions.station02);const revision=snap.revision;assert.equal((await act('complete',undefined,{deviceId:'replacement'})).revision,revision);
 const four=await api(4,'poll',{deviceId:'four'});assert.equal(four.mission.missionId,a.missionId);assert.deepEqual(four.mission.decisions.station03.selectedIds,['s03:session']);assert.deepEqual(four.mission.evidence.filter(item=>item.station===3).map(item=>item.id),['s03:session']);assert.deepEqual(four.mission.evidence.find(item=>item.id==='s03:session').description,saved.station03Experience.records.find(item=>item.id==='s03:session').description);assert(!four.mission.evidence.some(item=>item.id==='s03:meeting'));
 await sleep(6100);snap=await api(3,'poll',{deviceId:'replacement'});assert.equal(snap.mission.missionId,b.missionId);assert.equal(snap.mission.language,'en');assert.equal(snap.mission.decisions.station03,undefined);assert.deepEqual(snap.mission.evidence,b.evidence);
 console.log('Station03 PASS: conditional mappings, irrelevant collection, removal, hidden metadata, validation/CAS/ownership, restart, lease recovery/FIFO, Arabic-English isolation, original timer/history, six-second reset and Station04 evidence handoff.');
}finally{if(child?.exitCode===null)await stop();assert(temp.startsWith(join(tmpdir(),'cyber-investigation-')));rmSync(temp,{recursive:true,force:true});}
