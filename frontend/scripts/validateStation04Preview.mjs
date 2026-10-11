import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPreviewRecord,applyPreviewAction,previewMission,previewPhase,restorePreviewRecord,PREVIEW_PHASES} from '../src/dev/station04Preview.mjs';
for(const language of ['ar','en'])for(const phase of PREVIEW_PHASES){
 const record=createPreviewRecord(language,phase);
 assert.equal(previewPhase(record),phase);assert.equal(record.mission.language,language);
 assert.deepEqual(restorePreviewRecord(JSON.stringify(record),language,phase),record);
 assert.equal(record.mission.avatarId,'cyber-02');assert.equal(record.mission.currentStation,4);
 assert(record.mission.decisions.station03.dataDecisions['data-01'].sharing.confirmedAt);
 assert(record.mission.caseFile.physicalClues.documents.length);
 assert(!previewMission(record).decisions.station04?.privateScore);
}
let record=createPreviewRecord('en');
const original=structuredClone(record),act=payload=>{record=applyPreviewAction(record,payload);};
act({action:'begin-response'});assert.equal(original.mission.decisions.station04,undefined);
for(const [phase,selection]of [['person',record.mission.narrativeAssignment.choices.find(p=>p.id!==record.mission.narrativeAssignment.associatedPersonId).id],['response','investigate_myself'],['evidence','delete_evidence']]){
 assert.throws(()=>act({action:phase==='evidence'?'submit-response':'advance-response'}));
 act({action:'select-response',phase,selection});
 record=restorePreviewRecord(JSON.stringify(record),'en',phase);
 act({action:phase==='evidence'?'submit-response':'advance-response'});
}
assert.equal(previewPhase(record),'complete');assert.equal(record.mission.decisions.station04.privateScore.total,50);
assert.equal(record.mission.startedAt,original.mission.startedAt);
assert.deepEqual(record.mission.evidence,original.mission.evidence);
assert.throws(()=>applyPreviewAction({...record,devPreview:false},{action:'submit-response'}));
assert.equal(previewPhase(restorePreviewRecord(JSON.stringify(record),'en','intro')),'intro');
assert.equal(previewPhase(restorePreviewRecord('invalid','ar','response')),'response');
assert.equal(previewPhase(createPreviewRecord('ar','invalid')),'intro');
const config=readFileSync(new URL('../src/config/developmentConfig.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
assert(config.includes('DEV_STATION04_PREVIEW = import.meta.env.DEV &&'));
assert(app.includes('const Station04DevPreview = import.meta.env.DEV'));
console.log('Station04 preview: all ten language/phase fixtures, real transitions, isolated immutable state, refresh, reset and development gates passed.');
