import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../src/caseEngine.js';
import {financeTemplate} from '../src/station03Cases.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {initializeVaultAssignment,recordVaultAction,isVaultReplay,publicVault} from '../src/station04Vault.js';
import {recordIncidentResponse} from '../src/station04Response.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as sleep} from 'node:timers/promises';
import {createServer} from 'node:net';
const now=new Date().toISOString();
function fixture(definition){
 const r={missionId:'CM-VAULT4',stage:3,phase:'ACTIVE',timerPaused:true,revision:0,caseAssignment:{version:1,definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:'CM-VAULT4',playerName:'Vault flow',startedAt:now,status:'active',currentStation:4,completedStations:[1,2,3],narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(definition.id),now),decisions:{station01:{scenarioId:'SMS-PHISH-001'},station02:{items:{}}},evidence:[]}};
 initializeVaultAssignment(r,{newMission:true,random:()=>7});ensureStation03Experience(r,caseCatalog(r));r.stage=4;
 return r;
}
for(const definition of CASES){
 const r=fixture(definition),baseline=structuredClone(r.mission),privateCode=r.vaultAssignment.code;
 const locked=publicVault(r);assert(!locked.discovery);assert(!locked.revealedCode);assert(!locked.code);assert(!locked.requests);
 assert.throws(()=>recordIncidentResponse(r,{action:'begin-response'}),/archive/);
 const wrong={action:'vault-attempt',code:'9999',requestId:'wrong-request'};
 recordVaultAction(r,wrong,now);const first=JSON.stringify(r);
 recordVaultAction(r,wrong,now);assert.equal(JSON.stringify(r),first);assert(isVaultReplay(r,wrong));
 assert.throws(()=>isVaultReplay(r,{...wrong,code:privateCode}),/reused/);
 assert.throws(()=>recordVaultAction(r,{...wrong,requestId:'rapid-request'},now),/wait/);
 assert.equal(r.vaultState.awardAvailable,600);assert.equal(r.vaultState.attemptCount,1);
 assert.throws(()=>recordVaultAction(r,{action:'vault-continue',requestId:'skip-request'}),/first/);
 const later=new Date(Date.parse(now)+3000).toISOString();
 recordVaultAction(r,{action:'vault-attempt',code:'٠٠٠٧',requestId:'right-request'},later);
 assert(publicVault(r).discovery);assert(!publicVault(r).revealedCode);assert.equal(r.vaultState.awardAvailable,600);
 const discovery=r.vaultState.discovery;
 assert(Date.parse(discovery.timestamp)<Date.parse(now),'archive follows historical case events');
 assert(!/responsible|culprit|guilty|caused|is the person/i.test(discovery.description.en),'the archive never states a verdict');
 const pc=r.mission.narrativeAssignment.choices;assert.equal(pc.filter(p=>discovery.description.en.includes(p.name.en)).length,3,'conversation involves exactly the three suspects');
 recordVaultAction(r,{action:'vault-continue',requestId:'continue-request'},later);recordIncidentResponse(r,{action:'begin-response'},later);
 assert.equal(r.mission.decisions.station04.phase,'person');assert.equal(r.mission.startedAt,baseline.startedAt);assert.deepEqual(r.mission.evidence,baseline.evidence);assert.deepEqual(r.mission.decisions.station03,baseline.decisions.station03);assert(!r.scoring);
 const hints=fixture(definition);
 assert.throws(()=>recordVaultAction(hints,{action:'vault-hint',level:3,requestId:'skip-hint-request'}),/next/);
 for(const [level,award] of [[1,500],[2,300],[3,50]]){
  const body={action:'vault-hint',level,requestId:`hint-request-${level}`};recordVaultAction(hints,body,now);const after=JSON.stringify(hints);
  recordVaultAction(hints,body,now);assert.equal(JSON.stringify(hints),after);
  recordVaultAction(hints,{...body,requestId:`repeat-hint-${level}`},now);assert.equal(hints.vaultState.awardAvailable,award);
  assert.equal(Boolean(publicVault(hints).revealedCode),level===3);
 }
 assert.equal(publicVault(hints).revealedCode,hints.vaultAssignment.code);assert(hints.vaultState.unlockedAt);
 const serialized=publicMission(hints);assert(!serialized.vaultAssignment);assert(!serialized.vaultState);assert(!serialized.vault.references.email.metadata);assert(!JSON.stringify(serialized.vault).includes('isIncidentRelevant'));
 const legacy=fixture(definition);delete legacy.vaultAssignment;recordIncidentResponse(legacy,{action:'begin-response'});assert(!publicVault(legacy));
 const inProgress=fixture(definition);inProgress.mission.decisions.station04={version:2,phase:'person'};assert(!publicVault(inProgress),'already-started responses stay legacy');
}

const dir=mkdtempSync(join(tmpdir(),'vault-flow-')),file=join(dir,'state.json'),record=fixture(CASES[3]);record.phase='QUEUED';record.order=1;
writeFileSync(file,JSON.stringify({sequence:1,missions:{[record.missionId]:record},stations:{}}));
const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(r=>server.close(r));
const root=fileURLToPath(new URL('../',import.meta.url)),base=`http://127.0.0.1:${port}/api/booth`;let child;
async function start(){child=spawn(process.execPath,['src/server.js'],{cwd:root,windowsHide:true,stdio:'pipe',env:{...process.env,NODE_ENV:'test',BOOTH_DEV_RECOVERY:'true',PORT:String(port),BOOTH_STORE_FILE:file}});child.stdout.resume();let errors="";child.stderr.on("data",b=>errors+=b);for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(errors);try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return;}catch{}await sleep(50);}throw Error('Server startup: '+errors);}
async function stop(){if(child){const ended=once(child,'exit');child.kill();await ended;child=null;}}
async function api(path,body={},status=200){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:'vault-device',missionId:record.missionId,pauseTimer:true,...body})});const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data;}
const action=(body,status)=>api('/stations/4/resolution',body,status),disk=()=>JSON.parse(readFileSync(file,'utf8')).missions[record.missionId];
try{
 await start();await api('/stations/4/poll');await sleep(2600);let state=await api('/stations/4/poll');
 assert(state.mission.vault&&!state.mission.vault.discovery);
 await action({action:'begin-response',revision:state.revision},400);
 await action({action:'vault-attempt',code:'0007',requestId:'wrong-owner',revision:state.revision,deviceId:'other-device'},409);
 const attempt={action:'vault-attempt',code:'9999',requestId:'http-attempt',revision:state.revision};state=await action(attempt);const revision=state.revision;
 assert.equal((await action(attempt)).revision,revision,'old revision duplicate is safe');
 await action({...attempt,code:'0007'},400);
 await action({...attempt,requestId:'http-fast',revision},400);
 assert.equal(disk().vaultState.attemptCount,1);
 state=await action({action:'vault-hint',level:1,requestId:'http-hint-1',revision});
 const before=structuredClone(disk());await stop();await start();state=await api('/stations/4/poll');
 assert.deepEqual(disk().vaultState,before.vaultState);assert.deepEqual(disk().vaultAssignment,before.vaultAssignment);
 await api('/recovery/stations/4/release');await api(`/recovery/${record.missionId}/resume`);await sleep(2600);state=await api('/stations/4/poll');
 assert.equal(state.mission.vault.awardAvailable,500);assert.equal(state.mission.startedAt,now);
 await action({action:'vault-hint',level:2,requestId:'stale-revision',revision:0},409);
 for(const level of [2,3])state=await action({action:'vault-hint',level,requestId:`http-hint-${level}`,revision:state.revision});
 assert.equal(state.mission.vault.revealedCode,'0007');assert(state.mission.vault.discovery);
 state=await action({action:'vault-continue',requestId:'http-continue',revision:state.revision});
 assert.equal(state.mission.decisions.station04.phase,'person');assert.equal(disk().vaultState.awardAvailable,50);assert(!disk().scoring,'no new score finalization in Step 2');
 assert.deepEqual(disk().mission.evidence,record.mission.evidence);
 console.log('Vault flow PASS: four cases, both digit sets, no leakage before reveal, hints/cooldown/idempotency, owner/revision enforcement, restart/recovery and unchanged legacy/scoring/evidence.');
}finally{await stop();}
