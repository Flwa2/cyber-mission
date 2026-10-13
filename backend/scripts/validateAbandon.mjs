import assert from 'node:assert/strict';
import {hiddenDeskBonus} from '../src/progressiveScoring.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';

// Hidden Station 02 bonus tiers (3 or fewer correct -> 0, 4 -> 50, 5 -> 100, 6 -> 150).
const items=n=>Object.fromEntries(['usb','badge','documents','cable','qr','power'].map((id,i)=>[id,{actionId:i<n?'report':'leave'}]));
for(const [n,bonus] of [[0,0],[3,0],[4,50],[5,100],[6,150]])assert.equal(hiddenDeskBonus(items(n)),bonus,`${n} correct`);
assert.equal(hiddenDeskBonus({...items(6),documents:{actionId:'secure'}}),150);
assert.equal(hiddenDeskBonus({...items(6),usb:{actionId:'connect'}}),100);

const dir=mkdtempSync(join(tmpdir(),'abandon-')),file=join(dir,'booth.json'),now=new Date().toISOString();
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const root=fileURLToPath(new URL('../',import.meta.url)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(process.execPath,['src/server.js'],{cwd:root,env:{...process.env,PORT:String(port),BOOTH_STORE_FILE:file,NODE_ENV:'test'},stdio:'pipe',windowsHide:true});
const base=`http://127.0.0.1:${port}/api`;
async function call(n,action,missionId,body={},expect=200){const res=await fetch(`${base}/booth/stations/${n}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:`dev-${n}`,missionId,...body})});const data=await res.json();assert.equal(res.status,expect,JSON.stringify(data));return data;}
const board=async()=>(await (await fetch(`${base}/booth/leaderboard`)).json()).entries;
const disk=id=>JSON.parse(readFileSync(file,'utf8')).missions[id];
const mk=(id,name,done)=>({missionId:id,playerName:name,language:'en',startedAt:now,status:'active',currentStation:1,completedStations:[],decisions:{station01:{scenarioId:'SMS-PHISH-001',senderInspected:true,messageDetailsViewed:true,linkInspected:true,finalAction:'report',completedAt:done?now:null}},evidence:[],flags:{}});
try{
 for(let i=0;i<100;i++){try{if((await fetch(`${base}/health`)).ok)break;}catch{}await sleep(50);}
 // A player who confirms the exit during Station 01, before any score exists.
 let r=await call(1,'sync','CM-ABAN01',{mission:mk('CM-ABAN01','Leaver',false),revision:0});
 let out=await call(1,'abandon','CM-ABAN01');
 assert.equal(out.abandoned,true);assert.equal(disk('CM-ABAN01').phase,'ABANDONED');assert.equal(disk('CM-ABAN01').abandonedStation,1);assert(disk('CM-ABAN01').abandonedAt);
 const stamp=disk('CM-ABAN01').abandonedAt;
 out=await call(1,'abandon','CM-ABAN01');assert.equal(out.abandoned,true);assert.equal(disk('CM-ABAN01').abandonedAt,stamp,'idempotent');
 // A scored participant who leaves at Station 02 vanishes from the leaderboard but the record is kept.
 r=await call(1,'sync','CM-ABAN02',{mission:mk('CM-ABAN02','Scored Leaver',true),revision:0});
 assert.equal((await board()).length,1);
 await call(2,'poll','CM-ABAN02');await sleep(2600);await call(2,'poll','CM-ABAN02');
 out=await call(2,'abandon','CM-ABAN02');assert.equal(out.abandoned,true);
 assert.equal(disk('CM-ABAN02').abandonedStation,2);assert(disk('CM-ABAN02').scoring.total>0,'kept for audit');
 assert.equal((await board()).length,0,'abandoned missions are not ranked');
 const events=await (await fetch(`${base}/booth/events`)).json();
 assert.equal(events.active.participants,0);
 // The abandoned player cannot resume or republish.
 await call(2,'desk','CM-ABAN02',{objectId:'usb',actionId:'report',revision:0},409);
 out=await call(1,'sync','CM-ABAN02',{mission:mk('CM-ABAN02','Scored Leaver',true),revision:0});assert.equal(disk('CM-ABAN02').phase,'ABANDONED');
 console.log('Abandon PASS: bonus tiers, idempotent confirmed exit, audit retention, leaderboard/event-count exclusion, no resume');
}finally{const exit=once(child,'exit');child.kill();await exit;}
