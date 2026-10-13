import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {initializeVaultAssignment,bindVaultClues,recordVaultAction,publicVault} from '../src/station04Vault.js';
import {VAULT_RULES_V3,applyVaultRule,createVaultCodeAssignmentV3,decoyReference} from '../src/station04VaultRules.js';
import {VAULT_MAIL_VARIANTS} from '../src/station04VaultMail.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
import {recordInvestigation} from '../src/station03Investigation.js';
import {station04Evidence} from '../../frontend/src/stations/Station04/evidence.mjs';
import {scoreEvidence} from '../src/progressiveScoring.js';
import {workstationRecord} from '../../frontend/src/stations/Station03/workstationPresentation.js';

const now='2026-10-13T09:00:00.000Z';
const sequence=values=>{let i=0;return n=>{assert(i<values.length,'unexpected random draw');return values[i++]%n;};};
const weights={};
for(let ticket=0;ticket<100;ticket++){
 const a=createVaultCodeAssignmentV3(sequence(ticket<60?[ticket,48]:[ticket,0,0]));
 weights[a.ruleId]=(weights[a.ruleId]||0)+1;
}
assert.deepEqual(Object.values(weights),[15,15,15,15,15,15,10]);
// Exhaust all valid arithmetic inputs, including leading zeros and boundaries.
for(const rule of VAULT_RULES_V3.slice(4))for(let head=0;head<100;head++)for(let tail=0;tail<100;tail++){
 if(rule.id==='plus-2-last-2'&&tail>97||rule.id==='minus-2-last-2'&&tail<2||rule.id==='double-last-2'&&(tail<1||tail>49))continue;
 const ref=String(head).padStart(2,'0')+String(tail).padStart(2,'0'),answer=rule.apply(ref);
 assert.match(answer,/^\d{4}$/);assert.equal(answer.slice(0,2),ref.slice(0,2));
 const expected=rule.id==='plus-2-last-2'?tail+2:rule.id==='minus-2-last-2'?tail-2:tail*2;
 assert.equal(Number(answer.slice(2)),expected);
}
for(const rule of VAULT_RULES_V3.slice(0,4))for(let n=0;n<1000000;n++)assert.match(rule.apply(String(n).padStart(6,'0')),/^\d{4}$/);
let checked=0;
for(const definition of CASES)for(let ri=0;ri<7;ri++)for(let sender=0;sender<3;sender++)for(let variant=0;variant<3;variant++){
 const r={stage:3,mission:{missionId:'V3-TEST',startedAt:now,decisions:{},evidence:[],narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(definition.id+sender),now)},caseAssignment:{definition:structuredClone(definition),...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})}};
 const base=structuredClone(r);ensureStation03Experience(base,caseCatalog(base));
 initializeVaultAssignment(r,{newMission:true,random:sequence(ri<4?[ri*15,48,sender,variant]:[ri*15,0,4,sender,variant])});
 ensureStation03Experience(r,caseCatalog(r));
 const v=r.vaultAssignment,rule=VAULT_RULES_V3[ri];
 assert.equal(v.contentVersion,3);assert.equal(v.ruleId,rule.id);assert.equal(v.code,applyVaultRule(v.ruleId,v.reference));
 assert.equal(v.sender.id,r.mission.narrativeAssignment.choices[sender].id);assert.equal(v.templateIndex,variant);
 const mail=r.station03Experience.rows.find(x=>x.id===v.emailSnapshot.id),doc=r.station03Experience.rows.find(x=>x.id===v.referenceDocumentId);
 assert.deepEqual(mail,v.emailSnapshot);assert.equal(mail.metadata.from,`${v.sender.id}@example.com`);
 assert.equal(workstationRecord(mail).metadata.from,`${v.sender.id}@example.com`);
 assert.deepEqual(workstationRecord(mail).metadata.senderName,v.sender.name);
 for(const lang of ['ar','en']){
  assert(mail.description[lang].includes(v.sender.name[lang]));
  assert(doc.description[lang].includes(v.reference));
  assert(!v.clueSources.documents[0].description[lang].includes(rule[lang]));
  assert(!/vault|password|unlock|archive|خزنة|كلمة مرور|أرشيف/i.test(mail.description[lang]));
 }
 assert.equal(VAULT_MAIL_VARIANTS[v.ruleId].length,3);
 for(const x of v.clueSources.documents.slice(1))assert.notEqual(applyVaultRule(v.ruleId,x.metadata.reference),v.code);
 const ids=r.station03Experience.rows.map(x=>x.id);
 assert.deepEqual(scoreEvidence(r.station03Experience.rows,ids),scoreEvidence(base.station03Experience.rows,ids));
 // Refresh/resume does not reroll or rebind any part of the saved assignment.
 const restored=JSON.parse(JSON.stringify(r)),before=JSON.stringify(restored);
 initializeVaultAssignment(restored,{newMission:true,random:()=>{throw Error('reroll');}});
 ensureStation03Experience(restored,caseCatalog(restored));bindVaultClues(restored);assert.equal(JSON.stringify(restored),before);
 const act=(a,id,value)=>recordInvestigation(r.mission,a,id,now,r.station03Experience.rows,value,r.station03Experience);
 act('inspect',mail.id);act('add',mail.id);act('begin-classification');
 for(const q of r.station03Experience.dataChallenge.questions)act('answer',q.id,q.expectedAnswer);
 act('complete');assert(r.mission.decisions.station03.completedAt);
 r.stage=4;r.mission.currentStation=4;
 assert(station04Evidence(publicMission(r)).some(x=>x.id===mail.id),'manual evidence preserved');
 let pub=publicVault(r);assert.equal(pub.references.email,null);assert(!pub.discovery);assert(!pub.revealedCode);
 assert(!JSON.stringify(publicMission(r)).includes('emailSnapshot'));
 recordVaultAction(r,{action:'vault-hint',level:1,requestId:'hint-one'},now);
 recordVaultAction(r,{action:'vault-hint',level:2,requestId:'hint-two'},now);
 assert.equal(publicVault(r).hintRule.ar,rule.ar);assert.equal(r.vaultState.awardAvailable,300);
 recordVaultAction(r,{action:'vault-attempt',code:v.code.replace(/\d/g,d=>String.fromCharCode(1632+Number(d))),requestId:'right-answer'},now);
 assert(r.vaultState.unlockedAt);assert(!JSON.stringify(r.vaultState.discovery).includes('Account_Update.zip'));
 recordVaultAction(r,{action:'vault-continue',requestId:'continue-board'},now);
 assert(r.vaultState.discoveryAcknowledgedAt);assert.equal(r.mission.startedAt,now);
 checked++;
}
// Saved legacy assignments and content remain byte-for-byte unchanged; presentation omits old archive emails.
for(const contentVersion of [undefined,2]){
 const r={stage:4,caseAssignment:{definition:CASES[0]},mission:{startedAt:now,decisions:{},narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom('legacy'),now)},vaultAssignment:{version:1,contentVersion,ruleId:contentVersion?'plus-1-last-2':undefined,code:'0007',reviewReference:'170007',clueSources:{email:{id:'old-email',description:{en:'Original',ar:'الأصل'}},documents:[],document:null}}};
 const old=JSON.stringify(r);initializeVaultAssignment(r,{newMission:true});bindVaultClues(r);publicVault(r);assert.equal(JSON.stringify(r),old);assert.equal(publicVault(r).references.email,null);
 recordVaultAction(r,{action:'vault-attempt',code:'0007',requestId:'legacy-answer'},now);
 assert(r.vaultState.unlockedAt);
}
console.log(`Vault v3 PASS: ${checked} case/rule/sender/template flows, weighted selection, arithmetic boundaries, bilingual snapshots, manual evidence and refresh.`);
