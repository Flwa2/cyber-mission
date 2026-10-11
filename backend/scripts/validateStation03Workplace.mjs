import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience,publicStation03Experience} from '../src/station03Experience.js';
import {STATION03_FILENAMES,renameStation03Files} from '../../shared/station03Filenames.mjs';

for(const definition of CASES){
 const record={stage:3,phase:'ACTIVE',order:7,caseAssignment:{definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:'CM-COPY03',startedAt:'2026-10-07T08:00:00.000Z',hiddenScore:12,hiddenAttackState:3,decisions:{},flags:{},evidence:[]}};
 ensureStation03Experience(record,caseCatalog(record));
 const rows=record.station03Experience.rows;
 assert.equal(rows.filter(row=>row.source==='mail').length,6);
 for(const oldName of Object.keys(STATION03_FILENAMES))assert(!JSON.stringify(rows).includes(oldName),oldName);
 assert(!JSON.stringify(publicStation03Experience(record)).includes('expectedClassification'));
 assert.deepEqual(renameStation03Files(rows),rows);
 const saved=structuredClone(record),required=record.station03Experience.requiredDocumentIds;
 record.station03Experience.version=3;
 record.mission.decisions.station03={phase:'classification',selectedIds:[required[0]],classifications:{[required[0]]:{selectedClassification:'public',confirmedAt:'2026-10-07T08:01:00.000Z'}}};
 const document=rows.find(row=>row.id===required[0]);
 document.title='Workstation_Directory.pdf';
 document.description={en:'Previously read content',ar:'محتوى سبق الاطلاع عليه'};
 record.mission.evidence=[{station:3,id:document.id,title:document.title},{station:2,id:'usb',title:'Unchanged'}];
 const decisions=structuredClone(record.mission.decisions);
 ensureStation03Experience(record,[]);
 assert.equal(record.station03Experience.version,4);
 assert.equal(record.station03Experience.rows.find(row=>row.id===document.id).title,'Contacts.xlsx');
 assert.equal(record.station03Experience.rows.find(row=>row.id===document.id).description.en,'Previously read content');
 assert.deepEqual(record.mission.decisions,decisions);
 assert.equal(record.mission.evidence[0].title,'Contacts.xlsx');
 assert.deepEqual(record.mission.evidence[1],{station:2,id:'usb',title:'Unchanged'});
 for(const key of ['missionId','startedAt','hiddenScore','hiddenAttackState'])assert.equal(record.mission[key],saved.mission[key]);
 for(const key of ['stage','phase','order'])assert.equal(record[key],saved[key]);
 assert.deepEqual(record.station03Experience.requiredDocumentIds,required);
 assert.deepEqual(record.station03Experience.rows.map(row=>[row.id,row.expectedClassification]),saved.station03Experience.rows.map(row=>[row.id,row.expectedClassification]));
 const migrated=structuredClone(record);ensureStation03Experience(record,[]);assert.deepEqual(record,migrated);
}
console.log('PASS: four-case workplace content, short filenames, private answers, idempotent migration, preserved classification content/decisions/evidence/mission/timer/queue/scoring.');
