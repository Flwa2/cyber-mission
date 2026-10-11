import assert from 'node:assert/strict';
import {recordIncidentResponse} from '../src/station04Response.js';
import {publicMission} from '../src/caseEngine.js';
import {CASES} from '../src/caseDefinitions.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {caseCatalog,physicalClues} from '../src/caseEngine.js';
const now=new Date().toISOString();
for(const definition of CASES){
 for(let mask=0;mask<8;mask++){
  let record={stage:4,phase:'ACTIVE',caseAssignment:{version:1,definition},mission:{missionId:'CM-RESP04',startedAt:now,playerName:'Test',avatarId:'cyber-02',currentStation:4,status:'active',completedStations:[1,2,3],hiddenScore:123,flags:{kept:true},evidence:[{id:'kept'}],decisions:{station01:{scenarioId:'SMS-PHISH-001'},station02:{items:{}},station03:{selectedIds:[]}}}};
  const preserved=structuredClone(record.mission);
  const act=body=>recordIncidentResponse(record,body,now);
  assert.throws(()=>act({action:'submit-response'}));
  act({action:'begin-response'});assert.throws(()=>act({action:'advance-response'}));
  for(const [index,[phase,correct,other]]of [['person','sara','nora'],['response','notify_cybersecurity','delete_suspicious_content'],['evidence','preserve_and_follow_instructions','delete_evidence']].entries()){
   assert.throws(()=>act({action:'select-response',phase,selection:'forged'}));
   act({action:'select-response',phase,selection:mask&(1<<index)?correct:other});
   record=JSON.parse(JSON.stringify(record));
   if(index<2){act({action:'advance-response'});assert.throws(()=>act({action:'select-response',phase,selection:correct}));}
  }
  act({action:'submit-response'});
  assert.equal(record.mission.decisions.station04.privateScore.total,Math.max(0,(mask&1?500:0)+(mask&2?500:-150)+(mask&4?500:-150)));
  assert.equal(record.mission.decisions.station04.privateScore.maximum,1500);
  assert.equal(record.phase,'COMPLETED');assert.deepEqual(record.mission.completedStations,[1,2,3,4]);
  for(const key of ['missionId','startedAt','playerName','avatarId','hiddenScore','flags','evidence'])assert.deepEqual(record.mission[key],preserved[key]);
  for(const key of ['station01','station02','station03'])assert.deepEqual(record.mission.decisions[key],preserved.decisions[key]);
  const visible=publicMission(record);assert(!visible.caseResult);assert(!JSON.stringify(visible).includes('privateScore'));assert(!JSON.stringify(visible).includes('maximum'));
  const snapshot=JSON.stringify(record);assert.throws(()=>act({action:'submit-response'}));assert.equal(JSON.stringify(record),snapshot);
 }
 const story={stage:3,caseAssignment:{version:1,definition},mission:{startedAt:now,decisions:{station01:{},station02:{items:{}}},evidence:[]}};
 ensureStation03Experience(story,caseCatalog(story));
 assert(story.station03Experience.rows.some(row=>row.metadata.from==='sara@example.com'&&row.description.en.includes('printed copies')));
 assert.equal(physicalClues(story).documents.find(([label])=>label.en==='Prepared by')[1].en,'Sara');
 const savedRecord=story.station03Experience.rows.find(row=>row.description);
 story.stage=4;story.mission.decisions.station03={selectedIds:[savedRecord.id]};story.mission.evidence=[{id:savedRecord.id,station:3,title:savedRecord.title,source:savedRecord.source,metadata:savedRecord.metadata}];
 const recoveredMission=publicMission(story);
 assert.deepEqual(recoveredMission.evidence.map(item=>item.id),[savedRecord.id]);
 assert.deepEqual(recoveredMission.evidence[0].description,savedRecord.description);
 assert(!('isIncidentRelevant'in recoveredMission.evidence[0])&&!('relatedDecision'in recoveredMission.evidence[0]));
 assert(!recoveredMission.station03Experience);
}
console.log('Station04: all 32 case/response combinations, private 1500-point score, phase locks, serialization recovery, preserved prior state and consistent Sara clues passed.');
