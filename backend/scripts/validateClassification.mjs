import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {recordInvestigation} from '../src/station03Investigation.js';
import {assignCase,caseCatalog,publicMission,scoreCase} from '../src/caseEngine.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {CASES} from '../src/caseDefinitions.js';
import {financeTemplate} from '../src/station03Cases.js';

const now=new Date().toISOString();
const make=(id,language='ar')=>({
 missionId:id,language,startedAt:now,status:'active',currentStation:3,completedStations:[1,2],
 hiddenScore:7,hiddenAttackState:2,flags:{},
 decisions:{station01:{completedAt:now,linkOpened:false},station02:{completedAt:now,items:{}}},
 evidence:[{id:'prior',station:2}]
});
const mission=make('CM-CLASS1'),record={missionId:mission.missionId,mission,stage:3,phase:'QUEUED',order:1,revision:0,caseAssignment:{version:1,definition:CASES.find(c=>c.id==='case-03'),station03:financeTemplate(CASES.find(c=>c.id==='case-03'))}};

for(const definition of CASES){
 const caseAssignment={version:1,definition};
 if(definition.id==='case-03')caseAssignment.station03=financeTemplate(definition);
 const variant={missionId:'CM-ALL001',mission:make('CM-ALL001','en'),stage:3,caseAssignment};
 ensureStation03Experience(variant,caseCatalog(variant));
 const policy=variant.station03Experience;
 assert.equal(policy.requiredDocumentIds.length,2);
 assert(policy.rows.filter(row=>row.source==='mail').length>=6);
 assert.equal(new Set(policy.rows.filter(row=>row.source==='mail').map(row=>row.description.en)).size,policy.rows.filter(row=>row.source==='mail').length);
 assert.equal(policy.dataChallenge.version,2);
 assert.deepEqual(policy.dataChallenge.questions.map(question=>question.id),['q1-public-classification','q2-request-external-data','q3-trusted-friend-sharing']);
 assert.deepEqual(policy.rows.filter(row=>['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination'].includes(row.id)).map(row=>row.id),['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination']);
 const authoredMailIds=['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination'];
 assert.deepEqual(policy.rows.filter(row=>authoredMailIds.includes(row.id)).map(row=>row.evidenceEligible),[false,false,false]);
 const projection=publicMission(variant);
 const inboxIds=new Set(projection.caseFile.records.filter(row=>row.source==='mail').map(row=>row.id));
 const experienceIds=new Set(projection.station03Experience.records.filter(row=>row.source==='mail').map(row=>row.id));
 for(const id of authoredMailIds){
  assert(inboxIds.has(id),`${definition.id} case inbox includes ${id}`);
  assert(experienceIds.has(id),`${definition.id} Station 03 inbox includes ${id}`);
 }
 if(definition.id==='case-03')for(const id of ['finance:review-mail','finance:sharing-mail','finance:meeting-mail'])assert(inboxIds.has(id),`incident correspondence ${id} remains in inbox`);
 recordInvestigation(variant.mission,'begin-classification',null,now,policy.rows,null,policy);
 assert.equal(variant.mission.decisions.station03.phase,'classification');
 assert.throws(()=>recordInvestigation(variant.mission,'complete',null,now,policy.rows,null,policy));
 const snapshot=structuredClone(policy);ensureStation03Experience(variant,[]);assert.deepEqual(variant.station03Experience,snapshot);
 assert(!JSON.stringify(publicMission(variant)).includes('expectedAnswer'));
}

const rows=caseCatalog(record),classified=rows.filter(row=>row.expectedClassification);
assert.equal(classified.length,2);
for(const row of classified){
 recordInvestigation(mission,'inspect',row.id,now,rows);
 assert.throws(()=>recordInvestigation(mission,'add',row.id,now,rows));
 assert.throws(()=>recordInvestigation(mission,'add',row.id,now,rows,'internal'));
 recordInvestigation(mission,'add',row.id,now,rows,'public');
 assert.equal(mission.decisions.station03.classifications[row.id].expectedClassification,row.expectedClassification);
}
let projection=publicMission(record);
assert(!JSON.stringify(projection).includes('expectedClassification'));
assert.equal(projection.caseFile.records.filter(row=>row.requiresClassification).length,2);
recordInvestigation(mission,'remove','case:cover',now,rows);
assert(mission.decisions.station03.classifications['case:cover']);
recordInvestigation(mission,'add','case:cover',now,rows,'restricted');
assert.equal(mission.decisions.station03.classifications['case:cover'].selectedClassification,'restricted');
const scoringBefore=scoreCase(record).breakdown;
mission.decisions.station03.classifications['case:export'].selectedClassification='secret';
assert.deepEqual(scoreCase(record).breakdown,scoringBefore,'Global scoring architecture remains unchanged');

const other={missionId:'CM-CLASS2',mission:make('CM-CLASS2','en'),stage:3,phase:'QUEUED',order:2,revision:0};
assignCase({caseBag:['case-03']},record);
const original=structuredClone(record);
assignCase({caseBag:['case-01']},record);
assert.deepEqual(record,original);

const temp=mkdtempSync(join(tmpdir(),'cyber-classification-')),file=join(temp,'state.json'),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
record.mission=make('CM-CLASS1','ar');
other.caseAssignment=structuredClone(record.caseAssignment);
writeFileSync(file,JSON.stringify({sequence:2,stations:{},missions:{[record.missionId]:record,[other.missionId]:other}}));
let child;
async function start(){
 child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'ignore',windowsHide:true});
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}await sleep(100);}
 throw Error('server startup');
}
async function stop(){const ended=once(child,'exit');child.kill();await ended;}
async function api(station,action,body,status=200){
 const response=await fetch(`http://127.0.0.1:${port}/api/booth/stations/${station}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));
 for(const key of ['expectedAnswer','expectedClassification','expectedRoleId','dataChallengeScore','classificationPoints','sharingPoints'])assert(!JSON.stringify(data).includes(key));
 return data;
}
try{
 await start();
 let owner='original',snap=await api(3,'poll',{deviceId:owner});
 assert.equal(snap.mission.missionId,mission.missionId);
 assert.equal(snap.mission.language,'ar');
 const questions=snap.mission.station03Experience.dataChallenge.questions;
 assert.deepEqual(questions.map(question=>question.id),['q1-public-classification','q2-request-external-data','q3-trusted-friend-sharing']);
 assert.equal(questions[0].prompt.ar,'ما هو مستوى تصنيف البيانات الذي يسمح بمشاركة البيانات خارج الصندوق بدون اتفاقية؟');
 assert(!JSON.stringify(questions).includes('expectedAnswer'));
 await sleep(2600);snap=await api(3,'poll',{deviceId:owner});
 const act=async(action,itemId,value,status=200,device=owner)=>{
  const response=await api(3,'investigation',{deviceId:device,missionId:mission.missionId,revision:snap.revision,action,itemId,selectedClassification:value},status);
  if(status===200)snap=response;
  return response;
 };
 await act('answer',questions[1].id,'public',400);
 await act('classify','case:cover','restricted',400);
 await act('complete',null,null,400);
 await act('begin-classification',null,null);
 await act('answer',questions[0].id,'invalid-answer',400);
 await act('answer',questions[0].id,'public');
 const firstAnswer=structuredClone(snap.mission.decisions.station03.dataDecisions.answers[questions[0].id]);
 assert.equal(firstAnswer.selectedAnswer,'public');
 assert.equal(firstAnswer.confirmedAt!==undefined,true);
 const saved=structuredClone(snap.mission);
 await stop();await start();
 snap=await api(3,'poll',{deviceId:owner});assert.deepEqual(snap.mission,saved);
 await sleep(16000);owner='replacement';snap=await api(3,'poll',{deviceId:owner});assert.deepEqual(snap.mission,saved);
 await sleep(2600);snap=await api(3,'poll',{deviceId:owner});
 assert.deepEqual(snap.mission.station03Experience.dataChallenge.questions.map(question=>question.id),questions.map(question=>question.id));
 assert.equal(snap.mission.decisions.station03.dataDecisions.answers[questions[0].id].selectedAnswer,'public');
 await act('answer',questions[0].id,'public',400);
 await act('answer',questions[1].id,'data-management-office');
 await act('answer',questions[2].id,'contact-data-management-office');
 const completedChoices=structuredClone(snap.mission.decisions.station03.dataDecisions);
 assert.deepEqual(Object.keys(completedChoices.answers),questions.map(question=>question.id));
 await act('complete');
 assert.equal(snap.device.state,'RESETTING');
 assert.equal(snap.mission.startedAt,now);
 assert.equal(snap.mission.currentStation,4);
 assert.equal(snap.mission.decisions.station03.dataChallengeScore,undefined);
 const four=await api(4,'poll',{deviceId:'four'});
 assert.deepEqual(four.mission.decisions.station03.dataDecisions,completedChoices);
 assert(!four.mission.evidence.some(item=>item.id==='financial-summary'||String(item.id).includes('financial-data-sharing')));
 const disk=JSON.parse(readFileSync(file));
 const stored=disk.missions[mission.missionId].mission.decisions.station03;
 assert.equal(stored.dataChallengeScore.totalPoints,600);
 assert.equal(stored.dataChallengeScore.maxPoints,600);
 assert.equal(stored.dataChallengeScore.questions.length,3);
 assert(!disk.missions[mission.missionId].mission.evidence.some(item=>String(item.id).includes('financial')));
 await sleep(6100);
 snap=await api(3,'poll',{deviceId:owner});
 assert.equal(snap.mission.missionId,other.missionId);
 assert.equal(snap.mission.language,'en');
 assert(!snap.mission.decisions.station03);
 console.log('Scenario integration PASS: three ordered choices, no public answer key or correctness score, Arabic content, refresh/restart/lease recovery, mission-scoped IDs, private 600-point score, evidence isolation, unchanged timer, Station 04 handoff and reset.');
}finally{
 if(child?.exitCode===null)await stop();
 assert(temp.startsWith(join(tmpdir(),'cyber-classification-')));
 rmSync(temp,{recursive:true,force:true});
}
