import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {setTimeout as sleep} from 'node:timers/promises';
import {createServer} from 'node:net';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {initializeVaultAssignment,bindVaultClues} from '../src/station04Vault.js';
import {applyVaultRule,vaultRule} from '../src/station04VaultRules.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
import {scoreEvidence} from '../src/progressiveScoring.js';
import {station04Evidence} from '../../frontend/src/stations/Station04/evidence.mjs';

const now=new Date().toISOString(),root=fileURLToPath(new URL('../',import.meta.url));
const records={};
const facts=rows=>rows.map(({description,metadata,...r})=>r);
for(const definition of CASES)for(const digits of [0,7,1048,9999]){
 const id=`${definition.id}-${digits}`;
 const record={stage:3,phase:'ACTIVE',caseAssignment:{version:1,definition:structuredClone(definition),...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:id,startedAt:now,language:'en',completedStations:[1,2],narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(id),now),decisions:{station01:{scenarioId:'SMS-PHISH-001'},station02:{items:{}}},evidence:[]}};
 const baseline=structuredClone(record);
 ensureStation03Experience(baseline,caseCatalog(baseline));
 const legacy=JSON.stringify(baseline);
 initializeVaultAssignment(baseline);bindVaultClues(baseline);
 assert.equal(JSON.stringify(baseline),legacy,'legacy snapshots are not opted in');
 initializeVaultAssignment(record,{newMission:true,random:()=>digits});
 const original=structuredClone(record.vaultAssignment);
 initializeVaultAssignment(record,{newMission:true,random:()=>{throw Error('must not reroll');}});
 assert.deepEqual(record.vaultAssignment,original);
 assert.equal(original.contentVersion,3);
 assert.match(original.code,/^\d{4}$/);
 assert.match(original.reviewReference,/^\d{4,6}$/);
 assert.equal(applyVaultRule(original.ruleId,original.reviewReference),original.code);
 ensureStation03Experience(record,caseCatalog(record));
 assert.deepEqual(facts(record.station03Experience.rows),facts(baseline.station03Experience.rows),'evidence identity and scoring fields stay unchanged');
 const {email,document}=record.vaultAssignment.clueSources;
 assert.equal(document.title,definition.id==='case-03'?'Payments_Oct.xlsx':'Invoice_1048.pdf');
 assert.equal(record.station03Experience.rows.filter((r,i)=>JSON.stringify(r)!==JSON.stringify(baseline.station03Experience.rows[i])).length,2);
 for(const lang of ['ar','en']){
  assert(document.description[lang].includes(original.reviewReference));
  assert.equal(email,null);
  assert(!record.vaultAssignment.clueSources.documents[0].description[lang].includes(vaultRule(original.ruleId)[lang]));
  assert(record.vaultAssignment.emailSnapshot.description[lang]);
  assert(document.description[lang].startsWith(baseline.station03Experience.rows.find(r=>r.id===document.id).description[lang]));
  const publicState=publicMission(record);
  assert(!JSON.stringify(publicState).includes('vaultAssignment'));
  assert(!JSON.stringify(publicState).includes('clueSources'));
  assert(publicState.station03Experience.records.find(r=>r.id===document.id).description[lang].includes(original.reviewReference));
  assert.deepEqual(station04Evidence(publicState,lang),[],'sources are not auto-collected');
 }
 for(const ids of [[],record.station03Experience.rows.map(r=>r.id)])assert.deepEqual(scoreEvidence(record.station03Experience.rows,ids),scoreEvidence(baseline.station03Experience.rows,ids));
 assert.deepEqual(record.mission,baseline.mission,'timer, assignment and decisions untouched');
 const snapshot=JSON.stringify(record);
 ensureStation03Experience(record,caseCatalog(record));bindVaultClues(record);
 assert.equal(JSON.stringify(record),snapshot,'refresh never duplicates clues');
 record.mission.vaultAssignment={code:'DO-NOT-EXPOSE'};
 assert(!JSON.stringify(publicMission(record)).includes('DO-NOT-EXPOSE'));
 delete record.mission.vaultAssignment;
 records[id]=record;
}

// Real adapter, two separate processes: persisted values and source snapshots survive restart.
const dir=mkdtempSync(join(tmpdir(),'cyber-vault-')),store=join(dir,'state.json');
writeFileSync(join(dir,'fixtures.json'),JSON.stringify(records));
const probe=code=>spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:root,env:{...process.env,NODE_ENV:'test',BOOTH_STORE_FILE:store,FIXTURES:join(dir,'fixtures.json')},encoding:'utf8',windowsHide:true});
let result=probe("import {readFileSync} from 'node:fs';import {persistentStore as s} from './src/persistentStore.js';s.transaction(x=>x.missions=JSON.parse(readFileSync(process.env.FIXTURES,'utf8')));");
assert.equal(result.status,0,result.stderr);
result=probe("import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import {persistentStore as s} from './src/persistentStore.js';import {caseCatalog} from './src/caseEngine.js';import {ensureStation03Experience} from './src/station03Experience.js';s.transaction(x=>{for(const r of Object.values(x.missions))ensureStation03Experience(r,caseCatalog(r));});assert.deepEqual(s.read().missions,JSON.parse(readFileSync(process.env.FIXTURES,'utf8')));");
assert.equal(result.status,0,result.stderr);

// Isolated real HTTP server: new-registration boundary, hostile client field,
// resync/restart, public poll, and an existing mission that must remain legacy.
const portServer=createServer();portServer.listen(0,'127.0.0.1');await once(portServer,'listening');
const port=portServer.address().port;await new Promise(r=>portServer.close(r));
const apiStore=join(dir,'api.json'),base=`http://127.0.0.1:${port}`;let child;
async function start(){
 child=spawn(process.execPath,['src/server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),BOOTH_STORE_FILE:apiStore,BOOTH_DEV_RECOVERY:'true'},stdio:'pipe',windowsHide:true});
 let errors='';child.stderr.on('data',b=>errors+=b);child.stdout.resume();
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(errors);try{if((await fetch(base+'/api/health')).ok)return;}catch{}await sleep(50);}throw Error('Server not ready');
}
async function stop(){if(child){const exit=once(child,'exit');child.kill();await exit;child=null;}}
async function api(action,body={}){
 const res=await fetch(base+`/api/booth/stations/1/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:'vault-test',pauseTimer:true,...body})});
 const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));assert(!JSON.stringify(data).includes('vaultAssignment'));return data;
}
const mission={missionId:'CM-VAULT1',playerName:'Vault test',language:'en',startedAt:now,status:'active',currentStation:1,completedStations:[],decisions:{station01:{scenarioId:'SMS-PHISH-001'}},evidence:[],flags:{},vaultAssignment:{code:'CLIENT-ANSWER'}};
try{
 await start();let response=await api('sync',{mission});
 const saved=JSON.parse(readFileSync(apiStore,'utf8')).missions[mission.missionId];
 assert.match(saved.vaultAssignment.code,/^\d{4}$/);assert(!saved.mission.vaultAssignment);
 response=await api('sync',{mission,revision:response.revision});await api('poll');
 await stop();await start();await api('poll');
 assert.deepEqual(JSON.parse(readFileSync(apiStore,'utf8')).missions[mission.missionId].vaultAssignment,saved.vaultAssignment);
 for(const path of ['stations/1/release',`${mission.missionId}/resume`]){
  const res=await fetch(base+'/api/booth/recovery/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:'vault-test'})});
  assert.equal(res.status,200);assert(!JSON.stringify(await res.json()).includes('vaultAssignment'));
 }
 await api('poll');
 assert.deepEqual(JSON.parse(readFileSync(apiStore,'utf8')).missions[mission.missionId].vaultAssignment,saved.vaultAssignment,'staff recovery preserves assignment');
 await stop();
 // Pre-existing stage-1 record, without vault opt-in. No live data involved.
 const legacy=JSON.parse(readFileSync(apiStore,'utf8'));delete legacy.missions[mission.missionId].vaultAssignment;writeFileSync(apiStore,JSON.stringify(legacy));
 await start();await api('sync',{mission,revision:legacy.missions[mission.missionId].revision});
 assert(!JSON.parse(readFileSync(apiStore,'utf8')).missions[mission.missionId].vaultAssignment);
}finally{await stop();}
console.log('Vault PASS: 16 case/code fixtures, bilingual clues, leading zeros, unchanged evidence/scoring, private serialization, snapshot restart, HTTP new/legacy registration, recovery and resync.');
