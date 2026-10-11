import assert from 'node:assert/strict';
import {assignCase,caseCatalog,physicalClues,publicMission,scoreCase,recordResolution} from '../src/caseEngine.js';
import {CASES} from '../src/caseDefinitions.js';
import {SMS_SCENARIOS} from '../../frontend/src/data/smsScenarios.js';
import {PEOPLE} from '../../shared/casePeople.mjs';
import {recordInvestigation} from '../src/station03Investigation.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';import {createServer} from 'node:net';import {fileURLToPath} from 'node:url';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const make=(id='CM-CAS001',language='ar')=>({missionId:id,language,playerName:language==='ar'?'ريم':'Alex',avatarId:'cyber-03',createdAt:new Date().toISOString(),startedAt:new Date().toISOString(),status:'active',currentStation:1,completedStations:[],hiddenScore:0,hiddenAttackState:0,flags:{},evidence:[],decisions:{station01:{scenarioId:'SMS-PHISH-001',senderInspected:true,linkInspected:true,messageDetailsViewed:true,linkOpened:false,link:{exists:true,destination:'https://support-check.example.net/request'},finalAction:null,completedAt:null}}});
const rotation={};const counts={};for(let i=0;i<40;i++){const r={mission:make()};assignCase(rotation,r);const id=r.caseAssignment.definition.id;counts[id]=(counts[id]||0)+1;const saved=JSON.stringify(r.caseAssignment);assignCase(rotation,r);assert.equal(JSON.stringify(r.caseAssignment),saved);}assert.deepEqual(Object.values(counts),[10,10,10,10]);
for(const definition of CASES){
 const r={mission:make(),caseAssignment:{version:1,definition:structuredClone(definition)},phase:'ACTIVE',stage:3};
 const m=r.mission;m.decisions.station01.finalAction='report';
 m.decisions.station02={items:Object.fromEntries(['usb','badge','documents','cable','qr','power'].map(id=>[id,{actionId:id==='documents'?'secure':'report',recordedAt:m.startedAt}]))};
 const rows=caseCatalog(r),core=definition.steps.map(x=>'case:'+x.id);assert.equal(core.length,4);assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 assert(rows.every(x=>Number.isFinite(Date.parse(x.timestamp))));assert.deepEqual(caseCatalog(r),rows);
 assert(!rows.some(x=>x.id==='s03:usb'||x.id==='s03:navigation'));
 for(const p of PEOPLE)assert(rows.some(x=>JSON.stringify(x).includes(p.account)));
 const physical=physicalClues(r);assert.equal(physical.badge[0][1].en,PEOPLE.find(p=>p.id===definition.badgeId).name.en);
 assert.equal(physical.documents.find(([label])=>label==='Workstation')[1],PEOPLE.find(p=>p.id===definition.personId).device);
 assert.equal(physical.documents.find(([label])=>label.en==='Prepared by')[1].en,'Sara');
 const english=structuredClone(r);english.mission.language='en';assert.deepEqual(caseCatalog(english),rows);assert.deepEqual(physicalClues(english),physical);
 for(const id of [...core,'case:directory']){recordInvestigation(m,'inspect',id,m.startedAt,rows);recordInvestigation(m,'add',id,m.startedAt,rows);}
 const sanitized=publicMission(r);assert(!('hiddenScore'in sanitized));assert(!sanitized.caseResult);assert(sanitized.caseFile.records.every(x=>!('isIncidentRelevant'in x)&&!('relatedDecision'in x)));assert(sanitized.evidence.every(x=>!('isIncidentRelevant'in x)));
 assert.throws(()=>recordResolution(r,{action:'timeline',timeline:[core[0],core[0],null,null]}));
 assert.throws(()=>recordResolution(r,{action:'timeline',timeline:['case:old-menu',null,null,null]}));
 recordResolution(r,{action:'person',personId:definition.personId});recordResolution(r,{action:'phase',phase:2});recordResolution(r,{action:'timeline',timeline:core});recordResolution(r,{action:'phase',phase:3});recordResolution(r,{action:'containment',containment:definition.containment});
 assert.deepEqual(scoreCase(r).breakdown,{station01:200,station02:250,station03:300,station04:250});
 for(const scenario of SMS_SCENARIOS){
  const variant=structuredClone(r),message=variant.mission.decisions.station01;
  message.scenarioId=scenario.id;message.link={exists:scenario.link.exists};
  message.finalAction=scenario.classification==='phishing'?'report':'continue';
  assert.equal(scoreCase(variant).breakdown.station01,200,'equal attainable maximum for all twelve scenarios');
  for(const finalAction of ['report','continue','block','delete','openLink','constructor']){
   message.finalAction=finalAction;message.linkOpened=true;
   assert(Number.isFinite(scoreCase(variant).total));assert(scoreCase(variant).breakdown.station01<=200);
  }
 }
 const extraSafe=structuredClone(r);extraSafe.mission.decisions.station04.containment=['report','stop','account','preserve'];assert.equal(scoreCase(extraSafe).breakdown.station04,250);
 const flagOnly=structuredClone(r);flagOnly.mission.flags.unknownUsbConnected=true;assert(!caseCatalog(flagOnly).some(row=>row.id==='s03:usb'));
 const bad=structuredClone(r);bad.mission.decisions.station04.personId=PEOPLE.find(p=>p.id!==definition.personId).id;bad.mission.decisions.station04.timeline=[...core].reverse();bad.mission.decisions.station04.containment=['delete','retry'];assert.equal(scoreCase(bad).breakdown.station04,0);
 const slight=structuredClone(r);slight.mission.decisions.station03.selectedIds.push('case:old-menu');assert.equal(scoreCase(slight).breakdown.station03,288);
 const risky=structuredClone(r);risky.mission.decisions.station01.linkOpened=true;risky.mission.flags.suspiciousLinkOpened=true;risky.mission.decisions.station02.items.usb.actionId='connect';risky.mission.decisions.station02.items.cable.actionId='connect';
 for(const id of ['s03:usb','s03:peripheral','s03:navigation'])assert(caseCatalog(risky).some(x=>x.id===id));
 assert(scoreCase(risky).breakdown.station01<200);assert(scoreCase(risky).breakdown.station02<250);
 const missed=structuredClone(r);missed.mission.decisions.station03.selectedIds=[];missed.mission.decisions.station04.timeline=[null,null,null,null];assert.equal(scoreCase(missed).breakdown.station03,0);
 for(const fixture of [r,bad,slight,risky,missed]){const scores=scoreCase(fixture);assert(scores.total>=0&&scores.total<=1000);for(const [key,max]of Object.entries({station01:200,station02:250,station03:300,station04:250}))assert(scores.breakdown[key]>=0&&scores.breakdown[key]<=max);}
 recordResolution(r,{action:'submit'});assert.equal(r.result.total,1000);assert.equal(r.result.personId,definition.personId);assert.equal(r.mission.hiddenScore,1000);assert.equal(publicMission(r).caseResult.total,1000);assert.throws(()=>recordResolution(r,{action:'person',personId:'nora'}));
}
console.log('Case unit validation passed: balanced assignment, all four distinct solutions, bilingual content, clue mappings, conditional artifacts, hidden solution, selected-only timeline, partial credit and 1000-point bounds.');
const tmp=mkdtempSync(join(tmpdir(),'cyber-case-test-')),file=join(tmp,'state.json'),probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));let child;
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'ignore',windowsHide:true});for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:'+port+'/api/health')).ok)return;}catch{}await sleep(100);}throw Error('startup');}
async function stop(){const ended=once(child,'exit');child.kill();await ended;}
async function api(n,action,body,status=200){const response=await fetch('http://127.0.0.1:'+port+'/api/booth/stations/'+n+'/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data;}
const disk=()=>JSON.parse(readFileSync(file,'utf8'));
try{
 await start();const a=make(),b=make('CM-CAS002','en');
 let saved=await api(1,'sync',{deviceId:'one',mission:a,revision:0});assert.equal(disk().missions[a.missionId].mission.playerName,a.playerName);const assignment=structuredClone(disk().missions[a.missionId].caseAssignment);
 await api(1,'sync',{deviceId:'one',mission:{...a,caseId:'forged',caseFile:{},caseResult:{total:1000}},revision:saved.revision});assert.deepEqual(disk().missions[a.missionId].caseAssignment,assignment);
 a.decisions.station01.finalAction='report';a.decisions.station01.completedAt=new Date().toISOString();a.completedStations=[1];
 saved=await api(1,'sync',{deviceId:'one',mission:a,revision:saved.revision});await api(1,'release',{deviceId:'one',missionId:a.missionId,immediate:true});
 const bb=await api(1,'sync',{deviceId:'one',mission:b,revision:0});assert.notEqual(disk().missions[b.missionId].caseAssignment.definition.id,assignment.definition.id);
 b.decisions.station01.completedAt=new Date().toISOString();b.decisions.station01.finalAction='report';b.completedStations=[1];await api(1,'sync',{deviceId:'one',mission:b,revision:bb.revision});
 let snap=await api(2,'poll',{deviceId:'two'});assert.equal(snap.mission.caseId,assignment.definition.id);assert.equal(snap.mission.playerName,a.playerName);assert.equal(snap.mission.avatarId,a.avatarId);await sleep(2600);snap=await api(2,'poll',{deviceId:'two'});
 for(const [objectId,actionId]of[['usb','report'],['badge','report'],['documents','secure']])snap=await api(2,'desk',{deviceId:'two',missionId:a.missionId,revision:snap.revision,objectId,actionId});
 snap=await api(2,'desk',{deviceId:'two',missionId:a.missionId,revision:snap.revision,complete:true});
 let s3=await api(3,'poll',{deviceId:'three'});await sleep(2600);s3=await api(3,'poll',{deviceId:'three'});assert.equal(s3.mission.playerName,a.playerName);assert.equal(s3.mission.avatarId,a.avatarId);assert(!s3.mission.caseFile.records.some(x=>x.id==='s03:usb'));
 const core=assignment.definition.steps.map(x=>'case:'+x.id);
 for(const id of [...core,'case:directory'])for(const action of ['inspect','add'])s3=await api(3,'investigation',{deviceId:'three',missionId:a.missionId,revision:s3.revision,action,itemId:id});
 const evidence=structuredClone(s3.mission.evidence);await stop();await start();assert.deepEqual(disk().missions[a.missionId].caseAssignment,assignment);
 assert.deepEqual((await api(3,'poll',{deviceId:'three'})).mission.evidence,evidence);
 await sleep(16000);s3=await api(3,'poll',{deviceId:'new-three'});assert.deepEqual(s3.mission.evidence,evidence);assert.equal(s3.mission.caseId,assignment.definition.id);await sleep(2600);s3=await api(3,'poll',{deviceId:'new-three'});
 await api(3,'investigation',{deviceId:'three',missionId:a.missionId,revision:s3.revision,action:'complete'},409);
 for(const itemId of s3.mission.station03Experience.requiredDocumentIds)s3=await api(3,'investigation',{deviceId:'new-three',missionId:a.missionId,revision:s3.revision,action:'inspect',itemId});
 s3=await api(3,'investigation',{deviceId:'new-three',missionId:a.missionId,revision:s3.revision,action:'begin-classification'});
 for(const [index,question]of s3.mission.station03Experience.dataChallenge.questions.entries()){
  const selectedClassification=['public','data-management-office','contact-data-management-office'][index];
  s3=await api(3,'investigation',{deviceId:'new-three',missionId:a.missionId,revision:s3.revision,action:'answer',itemId:question.id,selectedClassification});
 }
 s3=await api(3,'investigation',{deviceId:'new-three',missionId:a.missionId,revision:s3.revision,action:'complete'});
 let s4=await api(4,'poll',{deviceId:'four'});await sleep(2600);s4=await api(4,'poll',{deviceId:'four'});assert.deepEqual(s4.mission.evidence.map(e=>e.id),evidence.map(e=>e.id));assert.equal(s4.mission.startedAt,a.startedAt);assert.equal(s4.mission.playerName,a.playerName);assert.equal(s4.mission.avatarId,a.avatarId);
 await api(4,'complete-placeholder',{deviceId:'four',missionId:a.missionId},409);
 await api(4,'resolution',{deviceId:'other',missionId:a.missionId,revision:s4.revision,action:'person',personId:'nora'},409);
 await api(4,'resolution',{deviceId:'four',missionId:b.missionId,revision:s4.revision,action:'person',personId:'nora'},409);
 const mutation=async payload=>{s4=await api(4,'resolution',{deviceId:'four',missionId:a.missionId,revision:s4.revision,...payload});return s4;};
 if(disk().missions[a.missionId].vaultAssignment){
  await mutation({action:'vault-attempt',code:disk().missions[a.missionId].vaultAssignment.code,requestId:'case-open-vault'});
  await mutation({action:'vault-continue',requestId:'case-review-vault'});
 }else await mutation({action:'begin-response'});
 const narrativePerson=disk().missions[a.missionId].mission.narrativeAssignment.associatedPersonId;
 await mutation({action:'select-response',phase:'person',selection:narrativePerson});await mutation({action:'advance-response'});
 await stop();await start();s4=await api(4,'poll',{deviceId:'four'});assert.equal(s4.mission.decisions.station04.associatedPersonSelection,narrativePerson);assert.equal(s4.mission.decisions.station04.phase,'response');
 await mutation({action:'select-response',phase:'response',selection:'notify_cybersecurity'});await mutation({action:'advance-response'});
 await mutation({action:'select-response',phase:'evidence',selection:'preserve_and_follow_instructions'});await mutation({action:'submit-response'});
 const result=structuredClone(s4.mission.decisions.station04);assert(!s4.mission.caseResult);assert(!result.privateScore);assert.equal(disk().missions[a.missionId].mission.decisions.station04.privateScore.total,1500);assert.equal(s4.mission.status,'complete');assert.equal(s4.mission.startedAt,a.startedAt);assert.equal(s4.device.state,'RESETTING');await mutation({action:'submit-response'});assert.deepEqual(s4.mission.decisions.station04,result);
 assert.equal(disk().missions[b.missionId].mission.decisions.station04,undefined);
 await stop();await start();s4=await api(4,'poll',{deviceId:'four'});assert.deepEqual(s4.mission.decisions.station04,result);
 await mutation({action:'finish'});await sleep(6100);assert.equal((await api(4,'poll',{deviceId:'four'})).device.state,'IDLE');
 const next=await api(2,'poll',{deviceId:'new-two'});assert.equal(next.mission.missionId,b.missionId);assert.equal(next.mission.language,'en');assert.equal(next.mission.playerName,b.playerName);assert.equal(next.mission.avatarId,b.avatarId);assert.notEqual(next.mission.caseId,assignment.definition.id);assert.equal(next.mission.decisions.station03,undefined);
 console.log('Case integration passed: immutable server assignment, concurrent A/B, Station 01-04 handoff, restart/refresh, lease recovery, collected evidence, fixed incident response, private score persistence, idempotency and automatic reset.');
}finally{if(child&&child.exitCode===null)await stop();rmSync(tmp,{recursive:true,force:true});}
