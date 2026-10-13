import assert from 'node:assert/strict';
import {scoreMessage,scoreDesk,scoreEvidence,scoreFinancial,scoreResponse,finalizeStationScore} from '../src/progressiveScoring.js';
import {SMS_SCENARIOS} from '../../frontend/src/data/smsScenarios.js';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../src/caseEngine.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {assignDataChallenge} from '../src/station03Sharing.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
const now=new Date().toISOString();
for(const scenario of SMS_SCENARIOS){
 const s={scenarioId:scenario.id,senderInspected:true,messageDetailsViewed:true,linkInspected:true,finalAction:scenario.classification==='phishing'?'report':'continue'};
 assert.equal(scoreMessage(s),1000);
 assert.equal(scoreMessage({...s,senderInspected:false}),900);
 if(scenario.classification==='phishing'){
  assert.equal(scoreMessage({...s,linkOpened:true}),600);
  assert.equal(scoreMessage({...s,finalAction:'block'}),650);
  assert.equal(scoreMessage({...s,linkOpened:true,finalAction:'report'}),600);
 }
 for(const finalAction of ['report','block','delete','continue','openLink'])for(const linkOpened of [true,false]){
  const score=scoreMessage({...s,finalAction,linkOpened});assert(score>=0&&score<=1000);
 }
}
assert.equal(scoreMessage({}),0);
const safe=Object.fromEntries(['usb','badge','documents','cable','qr','power'].map(id=>[id,{actionId:'report'}]));
assert.equal(scoreDesk(safe),1000);assert.equal(scoreDesk({usb:safe.usb}),200);
assert.equal(scoreDesk({...safe,usb:{actionId:'leave'}}),920);
assert.equal(scoreDesk({...safe,usb:{actionId:'connect'}}),600);
assert.equal(scoreDesk({usb:{actionId:'connect'}}),0);
for(const definition of CASES){
 const r={stage:3,caseAssignment:{definition},mission:{startedAt:now,decisions:{},evidence:[]}};
 ensureStation03Experience(r,caseCatalog(r));
 const rows=r.station03Experience.rows,valid=rows.filter(x=>x.isIncidentRelevant).map(x=>x.id),invalid=rows.find(x=>!x.isIncidentRelevant);
 assert(valid.length);assert.equal(scoreEvidence(rows,valid).total,900);
 assert(scoreEvidence(rows,valid.slice(1)).total<900);
 assert.equal(scoreEvidence(rows,[...valid,...valid]).total,900);
 assert.equal(scoreEvidence(rows,[...valid,invalid.id]).total,840);
 assert.equal(scoreEvidence(rows,rows.filter(x=>!x.isIncidentRelevant).map(x=>x.id)).total,0);
 assert.equal(scoreEvidence(rows,[...valid,'challenge:financial-summary']).total,900);
}
const challenge=assignDataChallenge(now),answers=Object.fromEntries(challenge.questions.map(q=>[q.id,{selectedAnswer:q.expectedAnswer,confirmedAt:now}]));
assert.equal(scoreFinancial(challenge,answers).totalPoints,600);
assert.equal(scoreFinancial(challenge,{[challenge.questions[0].id]:answers[challenge.questions[0].id]}).totalPoints,200);
const correct={version:2,associatedPersonSelection:'person',firstResponseSelection:'notify_cybersecurity',evidenceHandlingSelection:'preserve_and_follow_instructions'};
assert.equal(scoreResponse(correct,{associatedPersonId:'person'}).total,1500);
assert.equal(scoreResponse({...correct,firstResponseSelection:'investigate_myself'},{associatedPersonId:'person'}).total,1200);
assert.equal(scoreResponse({...correct,associatedPersonSelection:'wrong',firstResponseSelection:'delete_suspicious_content',evidenceHandlingSelection:'delete_evidence'},{associatedPersonId:'person'}).total,0);
const uncompleted={mission:{missionId:'CM-SCORE1',decisions:{station01:{scenarioId:SMS_SCENARIOS[0].id}}}};
assert.equal(finalizeStationScore(uncompleted,1),false);
uncompleted.mission.decisions.station01.completedAt=now;uncompleted.mission.status='timed-out';assert.equal(finalizeStationScore(uncompleted,1),false);
console.log('Progressive unit PASS: all 12 SMS scenarios, case-specific clues, partial credit, exposure penalties, missing/irrelevant evidence, de-duplication and bounds.');

// Real handlers and JSON persistence, isolated from the live booth.
const temp=mkdtempSync(join(tmpdir(),'cyber-scoring-')),file=join(temp,'state.json');
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
let child;const root=fileURLToPath(new URL('../',import.meta.url)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:root,env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'pipe',windowsHide:true});for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}await sleep(50);}throw Error('Server not ready');}
async function stop(){const exit=once(child,'exit');child.kill();await exit;}
async function api(n,action,body={}){const res=await fetch(`http://127.0.0.1:${port}/api/booth/stations/${n}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:`score-${n}`,missionId:'CM-SCORE1',...body})});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return data;}
async function checkLeaderboard(score,progress){const before=readFileSync(file,'utf8');const response=await fetch('http://127.0.0.1:'+port+'/api/booth/leaderboard');assert.equal(response.status,200);const data=await response.json();assert.equal(data.entries.length,1);assert.equal(data.entries[0].score,score);assert.equal(data.entries[0].completedStations,progress);assert.equal(data.entries[0].missionId,'CM-SCORE1');assert.equal(readFileSync(file,'utf8'),before,'leaderboard does not write booth state');}
const disk=()=>JSON.parse(readFileSync(file,'utf8')).missions['CM-SCORE1'];
const mission={missionId:'CM-SCORE1',playerName:'Score Test',language:'en',startedAt:now,status:'active',currentStation:1,completedStations:[],decisions:{station01:{scenarioId:'SMS-PHISH-001',senderInspected:true,messageDetailsViewed:true,linkInspected:true,linkOpened:true,completedAt:null}},evidence:[],flags:{},hiddenScore:999999,scoring:{total:999999}};
async function claim(n){await api(n,'poll',{pauseTimer:true});await sleep(2600);return api(n,'poll',{pauseTimer:true});}
try{
 await start();let result=await api(1,'sync',{mission,revision:0,pauseTimer:true});assert(!disk().scoring);
 // A later snapshot cannot erase a recorded unsafe action; client totals are ignored.
 mission.decisions.station01.linkOpened=false;mission.decisions.station01.finalAction='report';mission.decisions.station01.completedAt=now;
 result=await api(1,'sync',{mission,revision:result.revision,pauseTimer:true});assert.equal(disk().scoring.total,600);assert.equal(disk().mission.decisions.station01.linkOpened,true);
 await checkLeaderboard(600,1);const original=disk().scoring;await api(1,'sync',{mission,revision:0,pauseTimer:true});assert.deepEqual(disk().scoring,original);
 result=await claim(2);
 for(const objectId of Object.keys(safe))result=await api(2,'desk',{objectId,actionId:'report',revision:result.revision});
 assert.equal(disk().scoring.total,600);
 result=await api(2,'desk',{complete:true,revision:result.revision});assert.equal(disk().scoring.total,1750);
 await api(2,'desk',{complete:true,revision:0});assert.equal(disk().scoring.total,1750);
 await checkLeaderboard(1750,2);result=await claim(3);const rows=disk().station03Experience.rows;
 for(const row of rows.filter(x=>x.isIncidentRelevant)){
  result=await api(3,'investigation',{action:'inspect',itemId:row.id,revision:result.revision});
  result=await api(3,'investigation',{action:'add',itemId:row.id,revision:result.revision});
 }
 result=await api(3,'investigation',{action:'begin-classification',revision:result.revision});
 for(const q of disk().station03Experience.dataChallenge.questions)result=await api(3,'investigation',{action:'answer',itemId:q.id,selectedClassification:q.expectedAnswer,revision:result.revision});
 assert.equal(disk().scoring.total,1750);
 result=await api(3,'investigation',{action:'complete',revision:result.revision});assert.equal(disk().scoring.total,3250);
 await api(3,'investigation',{action:'complete',revision:0});assert.equal(disk().scoring.total,3250);
 await checkLeaderboard(3250,3);const saved=JSON.stringify(disk().scoring);await stop();await start();assert.equal(JSON.stringify(disk().scoring),saved);
 result=await claim(4);
 if(disk().vaultAssignment){
  result=await api(4,'resolution',{action:'vault-attempt',code:disk().vaultAssignment.code,requestId:'scoring-vault-open',revision:result.revision});
  result=await api(4,'resolution',{action:'vault-continue',requestId:'scoring-vault-continue',revision:result.revision});
 }else result=await api(4,'resolution',{action:'begin-response',revision:result.revision});
 for(const [phase,selection] of [['person',disk().mission.narrativeAssignment.associatedPersonId],['response','notify_cybersecurity'],['evidence','preserve_and_follow_instructions']]){
  result=await api(4,'resolution',{action:'select-response',phase,selection,revision:result.revision});
  if(phase!=='evidence')result=await api(4,'resolution',{action:'advance-response',revision:result.revision});
 }
 result=await api(4,'resolution',{action:'submit-response',revision:result.revision});assert.equal(disk().scoring.total,4750);assert.equal(disk().mission.decisions.station04.privateScore.total,1500);
 await checkLeaderboard(4750,4);const final=disk();await api(4,'resolution',{action:'submit-response',revision:0});assert.deepEqual(disk().scoring,final.scoring);
 await stop();await start();await checkLeaderboard(4750,4);assert.deepEqual(disk().scoring,final.scoring);assert.equal(disk().mission.decisions.station04.completedAt,final.mission.decisions.station04.completedAt);
 assert.equal(final.mission.startedAt,now);assert.equal(final.mission.missionId,mission.missionId);assert.equal(final.scoring.maximum,5150);assert.equal(Object.keys(final.scoring.stations).length,4);
 assert(!JSON.stringify(publicMission(final)).includes('action-5000-v1'));
 // A safe, otherwise identical final run reaches exactly the approved maximum.
 const perfect=structuredClone(final);delete perfect.scoring;perfect.mission.decisions.station01.linkOpened=false;
 for(let station=1;station<=4;station++)assert(finalizeStationScore(perfect,station));
 assert.equal(perfect.scoring.total,5150);assert.equal(perfect.scoring.maximum,5150);{const old=structuredClone(perfect);delete old.scoring;delete old.scoreModel;for(let station=1;station<=4;station++)finalizeStationScore(old,station);assert.equal(old.scoring.total,5000,'historical model unchanged');assert.equal(old.scoring.maximum,5000);assert.equal(old.scoring.hiddenBonus,undefined);}for(let station=1;station<=4;station++)assert.equal(finalizeStationScore(perfect,station),false);
 const resumed=structuredClone(final);delete resumed.scoring;assert(finalizeStationScore(resumed,4));assert.equal(resumed.scoring.total,4750,'older completed decisions recovered at next boundary');
 const timed=structuredClone(final);delete timed.scoring.stations.station04;timed.scoring.total=3100;timed.mission.status='timed-out';
 const beforeTimeout=JSON.stringify(timed.scoring);assert.equal(finalizeStationScore(timed,4),false);assert.equal(JSON.stringify(timed.scoring),beforeTimeout);
 const ledger=JSON.stringify(final.scoring);final.mission.hiddenScore=-999999;final.mission.decisions.station04.privateScore.total=999999;
 assert.equal(finalizeStationScore(final,4),false);assert.equal(JSON.stringify(final.scoring),ledger,'finalized awards cannot be overwritten by totals');

 console.log('Progressive API PASS: four completion boundaries, malicious-open history retained, forged totals ignored, exactly-once awards, restart recovery, private projection, 4600 unsafe/5000 safe totals, unchanged mission/time.');
}finally{if(child?.exitCode===null)await stop();}
