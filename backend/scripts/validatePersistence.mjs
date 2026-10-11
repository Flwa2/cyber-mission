import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const dir=mkdtempSync(join(tmpdir(),'cyber-persistence-')),file=join(dir,'state.json');
const port=24000+Math.floor(Math.random()*10000),base=`http://127.0.0.1:${port}`;
const env={...process.env,NODE_ENV:'test',PORT:String(port),BOOTH_STORE_FILE:file};
let child;
async function start(){
 child=spawn(process.execPath,['src/server.js'],{env,windowsHide:true,stdio:'pipe'});
 let errors='';child.stderr.on('data',chunk=>errors+=chunk);
 for(let i=0;i<100;i++){
  if(child.exitCode!==null)throw new Error(errors);
  try{if((await fetch(base+'/api/health')).ok)return;}catch{}
  await sleep(50);
 }
 throw new Error('Server did not start');
}
async function stop(){const exited=once(child,'exit');child.kill();await exited;child=null;}
async function request(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 assert(r.ok,`${method} ${path}: ${r.status}`);return r.json();
}
function probe(code,extra={}){return spawnSync(process.execPath,['--input-type=module','-e',code],{env:{...env,...extra},encoding:'utf8',windowsHide:true});}
try{
 await start();
 await Promise.all(['CM-PERSIST-A','CM-PERSIST-B'].map(missionId=>request('/api/missions','POST',{missionId})));
 await Promise.all(['A','B'].map(suffix=>request(`/api/missions/CM-PERSIST-${suffix}`,'PATCH',{playerName:`Participant ${suffix}`,avatarId:`avatar-${suffix}`,currentStation:2})));
 const a=await request('/api/missions/CM-PERSIST-A'),b=await request('/api/missions/CM-PERSIST-B');
 assert.notDeepEqual(a,b);
 assert.deepEqual(await request('/api/missions','POST',{missionId:'CM-PERSIST-A'}),a);
 await stop();await start();
 assert.deepEqual(await request('/api/missions/CM-PERSIST-A'),a);
 assert.deepEqual(await request('/api/missions/CM-PERSIST-B'),b);
 const board=await request('/api/booth/leaderboard');
 assert(!JSON.stringify(board).includes('Participant'),'legacy client records never become authoritative scores');
 const locked=probe("await import('./src/persistentStore.js')");assert.notEqual(locked.status,0);assert.match(locked.stderr,/already in use/);
 await stop();
 const original=readFileSync(file,'utf8');assert.doesNotThrow(()=>JSON.parse(readFileSync(file+'.bak','utf8')));
 const denied=probe("await import('./src/persistentStore.js')",{NODE_ENV:'production',BOOTH_STORAGE_DURABILITY:''});assert.notEqual(denied.status,0);
 const allowed=probe("await import('./src/persistentStore.js')",{NODE_ENV:'production',BOOTH_STORAGE_DURABILITY:'persistent-volume'});assert.equal(allowed.status,0,allowed.stderr);
 const rollback=probe("const {persistentStore:s}=await import('./src/persistentStore.js');try{s.transaction(x=>{x.sequence=999;throw Error('abort')})}catch{};if(s.read().sequence===999)process.exit(1)");assert.equal(rollback.status,0);
 assert.equal(readFileSync(file,'utf8'),original);
 const failedWrite=probe("import {mkdirSync} from 'node:fs';const {persistentStore:s}=await import('./src/persistentStore.js');mkdirSync(process.env.BOOTH_STORE_FILE+'.tmp');let rejected=false;try{s.transaction(x=>{x.sequence=123})}catch{rejected=true}if(!rejected)process.exit(1);try{s.read();process.exit(2)}catch{}",{BOOTH_STORE_FILE:join(dir,'failure.json')});assert.equal(failedWrite.status,0,failedWrite.stderr);
 const absent=join(dir,'missing.json');writeFileSync(absent+'.bak',original);
 const missing=probe("await import('./src/persistentStore.js')",{BOOTH_STORE_FILE:absent});assert.notEqual(missing.status,0);assert.match(missing.stderr,/recover explicitly/);
 writeFileSync(file,'{broken');const corrupt=probe("await import('./src/persistentStore.js')");assert.notEqual(corrupt.status,0);assert.equal(readFileSync(file,'utf8'),'{broken');
 console.log('Persistence PASS: parallel player isolation, restart recovery, duplicate create, legacy score isolation, single writer, rollback, backup, corruption and production guards.');
}finally{if(child?.exitCode===null)await stop();}
