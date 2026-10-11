import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {NARRATIVE_CHARACTERS} from '../../shared/narrativeCharacters.mjs';
import {seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
import {ensureNarrativeAssignment} from '../src/narrativeAssignment.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {caseCatalog,physicalClues,publicMission} from '../src/caseEngine.js';
import {recordIncidentResponse} from '../src/station04Response.js';
import {CASES} from '../src/caseDefinitions.js';
const now=new Date().toISOString(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const make=(i=0)=>({missionId:`CM-NAR${String(i).padStart(3,'0')}`,playerName:'Test',avatarId:'cyber-02',language:'ar',startedAt:now,status:'active',currentStation:1,completedStations:[],hiddenScore:0,flags:{},evidence:[],decisions:{station01:{scenarioId:'SMS-PHISH-001'}}});
const people=new Set(),positions=new Set(),combinations=new Set();
for(let i=0;i<40;i++){
 const record={stage:3,phase:'ACTIVE',mission:make(i),caseAssignment:{version:1,definition:CASES[i%4]}};
 const assignment=ensureNarrativeAssignment(record,{legacy:false,random:seededNarrativeRandom(i)});
 people.add(assignment.associatedPersonId);positions.add(assignment.choices.findIndex(p=>p.id===assignment.associatedPersonId));combinations.add(assignment.choices.map(p=>p.id).join(','));
 assert.equal(new Set(assignment.choices.map(p=>p.id)).size,3);assert.equal(new Set(assignment.choices.map(p=>p.avatarId)).size,3);
 for(const person of assignment.choices){assert(!/\s/.test(person.name.en));assert(!/\s/.test(person.name.ar));assert(['male','female'].includes(person.presentation));assert(existsSync(new URL(`../../frontend/public/assets/narrative-avatars/${person.avatarId}.svg`,import.meta.url)));}
 const snapshot=JSON.stringify(assignment);ensureNarrativeAssignment(record,{legacy:false});assert.equal(JSON.stringify(record.mission.narrativeAssignment),snapshot);
 ensureStation03Experience(record,caseCatalog(record));
 const associated=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 assert.deepEqual(physicalClues(record).documents.find(([label])=>label.en==='Prepared by')[1],associated.name);
 const email=record.station03Experience.rows.find(r=>r.title.en==='Review pack for the meeting');assert(email);assert.equal(email.metadata.from,`${associated.id}@example.com`);assert.deepEqual(email.metadata.senderName,associated.name);assert(email.description.en.includes(associated.name.en));assert(email.description.ar.includes(associated.name.ar));
 const classification=JSON.stringify(record.station03Experience.dataChallenge);
 record.mission.language='en';ensureStation03Experience(record,caseCatalog(record));assert.equal(JSON.stringify(record.mission.narrativeAssignment),snapshot);assert.equal(JSON.stringify(record.station03Experience.dataChallenge),classification);
 assert(!JSON.stringify(publicMission(record)).includes('associatedPersonId'));
 recordIncidentResponse(record,{action:'begin-response'});
 recordIncidentResponse(record,{action:'select-response',phase:'person',selection:associated.id});
 recordIncidentResponse(record,{action:'advance-response'});
 recordIncidentResponse(record,{action:'select-response',phase:'response',selection:'notify_cybersecurity'});recordIncidentResponse(record,{action:'advance-response'});
 recordIncidentResponse(record,{action:'select-response',phase:'evidence',selection:'preserve_and_follow_instructions'});recordIncidentResponse(record,{action:'submit-response'});
 assert.equal(record.mission.decisions.station04.privateScore.total,1500);
 const recovered=JSON.parse(JSON.stringify(record));ensureNarrativeAssignment(recovered);assert.equal(JSON.stringify(recovered.mission.narrativeAssignment),snapshot);
}
assert.equal(NARRATIVE_CHARACTERS.length,12);assert(people.size>=8);assert.equal(positions.size,3);assert(combinations.size>10);
const legacy={mission:make()};legacy.mission.decisions.station04={completedAt:now,associatedPersonSelection:'nora',privateScore:{total:200}};
const saved=JSON.stringify(legacy.mission.decisions);ensureNarrativeAssignment(legacy);assert.equal(legacy.mission.narrativeAssignment.associatedPersonId,'sara');assert.equal(JSON.stringify(legacy.mission.decisions),saved);
console.log(`Narrative unit PASS: 40 missions, ${people.size} associated people, ${combinations.size} combinations, all 3 positions, cross-station clue consistency, avatars, language/recovery stability, private scoring, unchanged classification and safe legacy migration.`);

const tmp=mkdtempSync(join(tmpdir(),'narrative-test-')),file=join(tmp,'state.json'),probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));let child;
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'ignore',windowsHide:true});for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}await sleep(100);}throw Error('startup');}
async function stop(){const ended=once(child,'exit');child.kill();await ended;}
async function api(n,action,body){const response=await fetch(`http://127.0.0.1:${port}/api/booth/stations/${n}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert(!JSON.stringify(data).includes('associatedPersonId'));return data;}
const disk=()=>JSON.parse(readFileSync(file,'utf8'));
try{
 await start();const assignments=[];
 for(let i=0;i<10;i++){
  const mission=make(i);let result=await api(1,'sync',{deviceId:'one',mission,revision:0});
  const assignment=disk().missions[mission.missionId].mission.narrativeAssignment;assert(assignment);assert.equal(disk().missions[mission.missionId].stage,1);
  mission.narrativeAssignment={associatedPersonId:'forged',choices:[]};mission.decisions.station01.completedAt=now;mission.completedStations=[1];
  result=await api(1,'sync',{deviceId:'one',mission,revision:result.revision});assert.deepEqual(disk().missions[mission.missionId].mission.narrativeAssignment,assignment);
  assignments.push(assignment);await api(1,'release',{deviceId:'one',missionId:mission.missionId,immediate:true});
 }
 assert(new Set(assignments.map(a=>a.associatedPersonId)).size>1);assert(new Set(assignments.map(a=>a.choices.map(p=>p.id).join(','))).size>1);
 await stop();await start();assert.deepEqual(Object.values(disk().missions).map(r=>r.mission.narrativeAssignment),assignments);
 const claimed=await api(2,'poll',{deviceId:'two'});assert.equal(claimed.mission.missionId,'CM-NAR000');assert.deepEqual(claimed.mission.narrativeAssignment.choices,assignments[0].choices);
 console.log('Narrative integration PASS: 10 independently created server missions, assignment saved before Station02, forged assignment ignored, varied combinations, backend restart preservation and FIFO handoff.');
}finally{if(child&&child.exitCode===null)await stop();rmSync(tmp,{recursive:true,force:true});}
