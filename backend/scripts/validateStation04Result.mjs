import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {publicMission} from '../src/caseEngine.js';
import {recordIncidentResponse} from '../src/station04Response.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
let count=0;
for(const definition of CASES)for(let seed=0;seed<10;seed++)for(const correct of [true,false]){
 const assignment=createNarrativeAssignment(seededNarrativeRandom(seed));
 const selected=assignment.choices.find(p=>(p.id===assignment.associatedPersonId)===correct);
 const record={mode:'independent-v1',stage:4,phase:'ACTIVE',timer:{activeMs:0,activeStartedAt:null},caseAssignment:{version:1,definition},mission:{status:'active',startedAt:new Date().toISOString(),completedStations:[1,2,3],narrativeAssignment:assignment,decisions:{station01:{},station02:{items:{}},station03:{},station04:{version:3,phase:'person',associatedPersonSelection:selected.id}},evidence:[],station04Result:{correct:true}}};
 assert(!publicMission(record).station04Result,'No leaked or client-injected verdict before final confirmation');
 recordIncidentResponse(record,{action:'advance-response'});
 const before=JSON.stringify(record),result=publicMission(record).station04Result;
 assert.equal(result.correct,correct);assert.equal(result.correctPerson.id,assignment.associatedPersonId);assert.equal(result.selectedPerson.id,selected.id);
 assert(result.explanation.en&&result.explanation.ar&&result.correctPerson.name.en&&result.correctPerson.name.ar);
 assert.equal(JSON.stringify(record),before,'Feedback must not mutate scores or progress');
 assert.deepEqual(publicMission(JSON.parse(before)).station04Result,result,'Feedback survives recovery');
 assert.throws(()=>recordIncidentResponse(record,{action:'select-response',phase:'person',selection:assignment.associatedPersonId}));
 record.phase='ACTIVE';assert(!publicMission(record).station04Result);
 count++;
}
console.log(`Station04 final feedback PASS: ${count} case/identity/answer combinations, bilingual explanations, final-only disclosure, immutable scoring and refresh recovery.`);
