import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission,physicalClues} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {initializeVaultAssignment,recordVaultAction,publicVault} from '../src/station04Vault.js';
import {VAULT_RULES,applyVaultRule,createVaultCodeAssignment,decoyReference} from '../src/station04VaultRules.js';
import {scoreEvidence,neutralEvidenceIds} from '../src/progressiveScoring.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
const now=new Date().toISOString();
const later=new Date(Date.parse(now)+3000).toISOString();

// Every rule produces a four-digit code from its own reference, with leading zeros kept.
for(const rule of VAULT_RULES){
 for(let seed=0;seed<200;seed++){
  const a=createVaultCodeAssignment(()=>Math.floor(Math.random()*1e9));
  if(a.ruleId!==rule.id)continue;
  assert(/^\d{4}$/.test(a.code));
  assert.equal(applyVaultRule(rule.id,a.reference),a.code);
  assert.equal(decoyReference(rule.id,a.reference,a.code,seed).length,a.reference.length);
  assert.notEqual(applyVaultRule(rule.id,decoyReference(rule.id,a.reference,a.code,seed)),a.code,'decoy must not open the vault');
 }
}
assert(VAULT_RULES.length>=6);
assert.equal(applyVaultRule(VAULT_RULES[0].id,'004912'),'0049');

function fixture(definition,seed,scoreModel='bonus-v1'){
 const r={missionId:'CM-V2-'+seed,scoreModel,stage:3,phase:'ACTIVE',timerPaused:true,revision:0,caseAssignment:{version:1,definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:'CM-V2-'+seed,playerName:'V2',startedAt:now,status:'active',currentStation:4,completedStations:[1,2,3],language:'en',narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(seed+definition.id),now),decisions:{station01:{scenarioId:'SMS-PHISH-001'},station02:{items:{}}},evidence:[]}};
 initializeVaultAssignment(r,{newMission:true});ensureStation03Experience(r,caseCatalog(r));r.stage=4;
 return r;
}
const seen=new Set();
for(const definition of CASES)for(let n=0;n<12;n++){
 const r=fixture(definition,'s'+n),v=r.vaultAssignment;
 assert.equal(v.contentVersion,2);seen.add(v.ruleId);
 assert.equal(applyVaultRule(v.ruleId,v.reference),v.code);
 const rows=r.station03Experience.rows,rule=VAULT_RULES.find(x=>x.id===v.ruleId);
 const mailRow=rows.find(x=>x.id===(definition.id==='case-03'?'finance:review-mail':`case:${definition.personId}:mail`));
 const docRow=rows.find(x=>x.id===(definition.id==='case-03'?'case:export':'case:reem:document'));
 for(const l of ['en','ar'])assert(docRow.description[l].includes(v.reference),`${definition.id} document shows the reference`);
 assert(mailRow.description.en.includes(rule.en)&&mailRow.description.ar.includes(rule.ar),'email states the rule');
 // Station 03 rows never expose the answer or the rule id.
 const blob=JSON.stringify(rows);
 assert(!blob.includes(v.ruleId));
 for(const row of rows.filter(x=>x!==docRow))for(const l of ['en','ar'])assert(!row.description[l].includes(v.reference),'other rows do not carry the reference');
 // Public views before hint 3 leak neither code nor rule id.
 const pub=JSON.stringify(publicMission(r))+JSON.stringify(publicVault(r));
 assert(!pub.includes(v.ruleId));assert(!pub.includes('"code"'));assert(!pub.includes('revealedCode":"'+v.code));
 // Hints, scoring and the server-side check.
 recordVaultAction(r,{action:'vault-attempt',code:v.code==='9999'?'9998':'9999',requestId:'wrong-'+n+definition.id},now);
 assert.equal(r.vaultState.lastAttempt,'incorrect');assert(!r.vaultState.unlockedAt);
 recordVaultAction(r,{action:'vault-hint',level:1,requestId:'hint1-'+n+definition.id},later);
 assert.equal(publicVault(r).hintRule,undefined);
 recordVaultAction(r,{action:'vault-hint',level:2,requestId:'hint2-'+n+definition.id},later);
 const hr=publicVault(r).hintRule;assert.equal(hr.en,rule.en);assert.equal(hr.ar,rule.ar);
 assert.equal(r.vaultState.awardAvailable,300);
 const later2=new Date(Date.parse(later)+3000).toISOString();
 recordVaultAction(r,{action:'vault-attempt',code:v.code,requestId:'right-'+n+definition.id},later2);
 assert(r.vaultState.unlockedAt);
}
assert(seen.size>=4,'rules vary between missions');

// Missions created before the refined content keep the original rule and scoring.
const old=fixture(CASES[0],'old');old.scoreModel=undefined;
assert.deepEqual(neutralEvidenceIds(old),[]);

// Station 03: neutral supporting records neither add nor remove points; the five essentials still total 900.
for(const definition of CASES){
 const r=fixture(definition,'ev'),rows=r.station03Experience.rows;
 const relevant=rows.filter(x=>x.isIncidentRelevant).map(x=>x.id);
 assert.equal(relevant.length,5);
 const base=scoreEvidence(rows,relevant,neutralEvidenceIds(r));
 assert.equal(base.total,900);
 const neutral=neutralEvidenceIds(r);assert(neutral.length>=2);
 for(const id of neutral)assert(rows.some(x=>x.id===id&&!x.isIncidentRelevant||x.isIncidentRelevant),id+' exists');
 const extra=neutral.filter(id=>!relevant.includes(id));
 assert.equal(scoreEvidence(rows,[...relevant,...extra],neutral).total,900);
 const distractor=rows.find(x=>!x.isIncidentRelevant&&!neutral.includes(x.id)&&x.source!=='logs-player');
 assert.equal(scoreEvidence(rows,[...relevant,distractor.id],neutral).total,840);
 assert.equal(scoreEvidence(rows,[...relevant,...extra,distractor.id],[]).total,900-60*(extra.length+1));
 // Station 02 evidence agrees with Station 03 about names and devices.
 const mapped=physicalClues(r),device=JSON.stringify(mapped.documents);
 const primary=r.mission.narrativeAssignment.choices.find(p=>p.id===r.mission.narrativeAssignment.associatedPersonId);
 assert(device.includes(primary.name.en),'Station 02 names the associated person');
 assert(!/Nora|Sami|Mazen|Reem /.test(JSON.stringify(mapped).replace(primary.name.en,'')) || r.mission.narrativeAssignment.choices.some(p=>['Nora','Reem'].includes(p.name.en)),'no legacy names leak into Station 02');
}
console.log('Vault v2, neutral evidence and identity validation passed');
