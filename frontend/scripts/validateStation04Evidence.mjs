import assert from 'node:assert/strict';
import {station04Evidence} from '../src/stations/Station04/evidence.mjs';

const document={id:'case:review',source:'documents',title:'Review.pdf',description:{en:'Exact saved review content',ar:'محتوى المراجعة المحفوظ'},type:'pdf',timestamp:'2026-01-01T08:00:00.000Z',metadata:{owner:'Planning'},isIncidentRelevant:true};
const incident={id:'case:access-log',source:'logs',title:{en:'Sign-in record',ar:'سجل الدخول'},description:{en:'Exact saved access record',ar:'سجل الوصول المحفوظ'},type:'access',timestamp:'2026-01-01T08:00:30.000Z',metadata:{device:'WS-27'},isIncidentRelevant:true};
const distractor={id:'case:newsletter',source:'mail',title:{en:'Team newsletter',ar:'النشرة'},description:{en:'Exact saved irrelevant content',ar:'محتوى غير ذي صلة محفوظ'},type:'mail',timestamp:'2026-01-01T08:01:00.000Z',metadata:{from:'team@example.com'},isIncidentRelevant:false};
function mission({selected=[],inspected=selected,desk={},language='en'}={}){
 const rows=[document,incident,distractor];
 return {
  missionId:'CM-TEST04',
  language,
  decisions:{
   station02:{items:desk},
   station03:{inspectedIds:inspected,selectedIds:selected}
  },
  evidence:selected.map(id=>{const row=rows.find(item=>item.id===id);return {...row,station:3};}),
  caseFile:{
   records:rows,
   physicalClues:{documents:[['Reference','DOC-EXACT-01'],['Prepared by','Employee A']]}
  }
 };
}

const all=station04Evidence(mission({selected:[document.id,incident.id,distractor.id],desk:{documents:{actionId:'secure',recordedAt:'2026-01-01T08:02:00.000Z'},qr:{actionId:'report',recordedAt:'2026-01-01T08:03:00.000Z'}}}));
assert.deepEqual(all.map(item=>item.id),['desk:documents','desk:qr',document.id,incident.id,distractor.id]);
assert.deepEqual(all[0].details,[['Reference','DOC-EXACT-01'],['Prepared by','Employee A']]);
assert.equal(all[0].action,'Secure the documents');
assert.equal(all[2].description.en,document.description.en);
assert.equal(all[3].description.en,incident.description.en);
assert.equal(all[4].description.en,distractor.description.en);
assert(!all.some(item=>Object.hasOwn(item,'isIncidentRelevant')));
assert(!JSON.stringify(all).match(/correct|incorrect/i));

const singleRelevant=station04Evidence(mission({selected:[document.id]}));
assert.deepEqual(singleRelevant.map(item=>item.id),[document.id]);
const irrelevantOnly=station04Evidence(mission({selected:[distractor.id]}));
assert.deepEqual(irrelevantOnly.map(item=>item.id),[distractor.id]);

const untouched=mission({inspected:[document.id]});
assert.deepEqual(station04Evidence(untouched),[]);
const removed=mission({inspected:[document.id],selected:[]});
assert.deepEqual(station04Evidence(removed),[]);
const noEvidence=station04Evidence(mission());
assert.deepEqual(noEvidence,[]);

const recovered=JSON.parse(JSON.stringify(mission({
 selected:[document.id,incident.id,distractor.id],
 desk:{documents:{actionId:'read',recordedAt:'2026-01-01T08:04:00.000Z'}}
})));
assert.deepEqual(station04Evidence(recovered).map(item=>item.id),['desk:documents',document.id,incident.id,distractor.id]);
assert.equal(station04Evidence(recovered,'ar')[0].title,'مستندات سرية');
assert.equal(station04Evidence(recovered,'ar')[1].description.ar,document.description.ar);

console.log('Station04 evidence: selected-only filtering, actual Station02 decisions, irrelevant items, empty state, localized previews and persisted recovery passed.');
