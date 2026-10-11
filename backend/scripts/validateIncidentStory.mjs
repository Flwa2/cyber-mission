import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {refineIncidentStory} from '../src/station03Narrative.js';
import {refineStation03Workplace} from '../src/station03Workplace.js';
import {recordInvestigation} from '../src/station03Investigation.js';
import {scoreEvidence} from '../src/progressiveScoring.js';
import {NARRATIVE_CHARACTERS} from '../../shared/narrativeCharacters.mjs';
import {workstationRecord} from '../../frontend/src/stations/Station03/workstationPresentation.js';
import {station04Evidence} from '../../frontend/src/stations/Station04/evidence.mjs';

const now='2026-10-07T10:00:00.000Z';
const facts=rows=>rows.map(({id,source,type,timestamp,isIncidentRelevant,relatedDecision,expectedClassification})=>({id,source,type,timestamp,isIncidentRelevant,relatedDecision,expectedClassification}));
let checked=0;
for(const definition of CASES)for(const [index,person] of NARRATIVE_CHARACTERS.entries()){
 const choices=[person,NARRATIVE_CHARACTERS[(index+1)%12],NARRATIVE_CHARACTERS[(index+2)%12]];
 const assignment={version:1,assignedAt:now,associatedPersonId:person.id,choices,scenarioId:['document-link','sharing-request','sign-in-request'][index%3]};
 const record={stage:3,phase:'ACTIVE',caseAssignment:{version:1,definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:`CM-STORY-${index}`,startedAt:now,completedStations:[1,2],language:'ar',narrativeAssignment:assignment,decisions:{station01:{scenarioId:'SMS-PHISH-001'},station02:{items:{}}},evidence:[]}};
 const original=refineStation03Workplace(caseCatalog(record));
 const isolated=structuredClone(record);isolated.station03Experience={rows:structuredClone(original),dataChallenge:{sentinel:'unchanged'}};
 refineIncidentStory(isolated);
 assert.deepEqual(facts(isolated.station03Experience.rows),facts(original));
 assert.deepEqual(isolated.station03Experience.dataChallenge,{sentinel:'unchanged'});
 for(const selected of [[],original.map(r=>r.id),original.filter(r=>r.isIncidentRelevant).map(r=>r.id)])assert.deepEqual(scoreEvidence(isolated.station03Experience.rows,selected),scoreEvidence(original,selected));
 ensureStation03Experience(record,caseCatalog(record));
 const {rows}=record.station03Experience,directory=rows.find(r=>r.id==='case:directory');
 assert.equal(record.station03Experience.storyVersion,3);
 for(const p of choices)for(const language of ['en','ar']){
  assert(directory.description[language].includes(p.name[language]));
  assert(directory.description[language].includes(p.role[language]));
  assert(directory.description[language].includes(`${p.id}@example.com`));
 }
 const core=definition.steps.map(step=>rows.find(r=>r.id===`case:${step.id}`));
 for(let i=0;i<core.length;i++){
  assert(core[i]);assert.equal(core[i].metadata.account,`${person.id}@example.com`);
  assert.equal(core[i].timestamp,new Date(Date.parse(now)+definition.steps[i].minute*60000).toISOString());
  if(i)assert(Date.parse(core[i].timestamp)>Date.parse(core[i-1].timestamp));
  // Human-readable display must not replace internal matching facts.
  for(const [key,value] of Object.entries(definition.steps[i].metadata))if(key!=='from')assert.deepEqual(core[i].metadata[key],value);
 }
 const event=core.find(r=>r.source==='logs');
 const readableEvent=workstationRecord(event);
 const technical=/\b(?:WS-\d+|OTHER-\d+|(?:PL|OP|HR|FN)-\d+)\b/;
 for(const lang of ['en','ar']){
  // Event and directory form a link without decoding a device number.
  const identityLabel=readableEvent.metadata.account[lang];
  const directoryComputer=rows.find(r=>r.id==='case:directory').description[lang];
  const logDevice=readableEvent.metadata.device[lang];
  assert(identityLabel);
  if(definition.id!=='case-02')assert(directoryComputer.includes(logDevice));
  else assert(rows.find(r=>r.id==='case:rule').description[lang].includes(lang==='en'?'employee services':'خدمات الموظفين'));
  assert(!readableEvent.description[lang].includes(person.name[lang]),'No named answer in the incident event');
  assert(!readableEvent.description[lang].includes(`${person.id}@example.com`));
 }
 const mail=rows.find(r=>r.title?.en==='Review pack for the meeting');assert(mail);
 assert.equal(mail.metadata.from,`${person.id}@example.com`);
 assert(!/signed in with|approved a sign-in|outside the organization|سجلت الدخول|وافقت على إشعار/.test(JSON.stringify(mail.description)));
 for(const p of choices)assert(rows.some(r=>r.source==='mail'&&r.metadata.from===`${p.id}@example.com`));
 for(const r of rows){
  assert(!JSON.stringify(r).includes('???'),'Arabic encoding');
  const {identityVersion,readablePresentation,...displayMetadata}=r.metadata;assert.deepEqual(workstationRecord(r).metadata,readablePresentation?.metadata||displayMetadata,'display must not alias saved identity');assert.deepEqual(workstationRecord(workstationRecord(r)),workstationRecord(r));
  if(r.description?.en){assert(r.description.ar);assert(!r.description.en.includes('undefined'));}
  const visible=workstationRecord(r);
  assert(!technical.test(JSON.stringify({title:visible.title,description:visible.description,metadata:visible.metadata})),`Technical code in visible ${r.id}`);
  assert(!Object.hasOwn(visible.metadata,'readablePresentation'));
 }
 const evidenceIds=[directory.id,...core.map(r=>r.id),mail.id];
 for(const id of evidenceIds){recordInvestigation(record.mission,'inspect',id,now,rows,undefined,record.station03Experience);recordInvestigation(record.mission,'add',id,now,rows,undefined,record.station03Experience);}
 // Remove one genuine clue: Station 04 must not silently reinsert it.
 recordInvestigation(record.mission,'remove',core[1].id,now,rows,undefined,record.station03Experience);
 const expected=evidenceIds.filter(id=>id!==core[1].id);
 record.stage=4;
 for(const language of ['en','ar']){
  const board=station04Evidence(publicMission(record),language);
  assert.deepEqual(new Set(board.map(r=>r.id)),new Set(expected));
  for(const item of board){const saved=rows.find(r=>r.id===item.id);assert.deepEqual(item.description,saved.description);const {identityVersion,readablePresentation,...metadata}=saved.metadata;assert.deepEqual(item.metadata,readablePresentation?.metadata||metadata);}
  assert(!JSON.stringify(board).includes('isIncidentRelevant'));
 }
 const saved=JSON.stringify(record);record.stage=3;const snapshot=JSON.stringify(record.station03Experience);
 ensureStation03Experience(record,[]);assert.equal(JSON.stringify(record.station03Experience),snapshot);
 record.stage=4;const recovered=JSON.parse(saved);assert.deepEqual(station04Evidence(publicMission(recovered)),station04Evidence(publicMission(record)));
 const historical=structuredClone(record);historical.stage=3;historical.station03Experience.storyVersion=2;
 historical.station03Experience.rows[0].description={en:'Previously read WS-31 PL-85 content',ar:'Previously saved Arabic copy'};
 const prior=JSON.stringify(historical);ensureStation03Experience(historical,[]);assert.equal(JSON.stringify(historical),prior,'Historical snapshots must not be rewritten');
 checked++;
}
console.log(`Incident story PASS: ${checked} case/employee combinations; bilingual identities, chronological core evidence, unchanged IDs/answers/relevance/scores, no confession, exact selected-only handoff, distractor preservation and snapshot recovery.`);
