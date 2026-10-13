import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {resumeMissionTimer} from './missionTimer.js';
import {publicMission} from './caseEngine.js';

export const independentContext=new AsyncLocalStorage();
const reject=(res,status,error)=>res.status(status).json({error});
export const independentMiddleware=(store,project)=>(req,res,next)=>{
 const {id,station,action}=req.params,token=req.body.accessToken;
 if(!/^CM-[A-Z0-9]{6}$/.test(id)||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return reject(res,401,'Invalid mission credential');
 if(!['sync','poll','activate','desk','investigation','resolution','abandon'].includes(action)||! /^[1-4]$/.test(station))return reject(res,400,'Invalid mission operation');
 const tokenHash=createHash('sha256').update(token).digest('hex');
 const record=(store.peek?store.peek():store.read()).missions[id];
 if(record&&(record.mode!=='independent-v1'||record.accessHash!==tokenHash))return reject(res,403,'Mission access denied');
 if(!record&&(action!=='sync'||station!=='1'))return reject(res,404,'Mission not found');
 if(req.body.missionId&&req.body.missionId!==id)return reject(res,400,'Mission does not match');
 if(!record){
  const mission=req.body.mission;
  if(mission?.missionId!==id||mission.currentStation!==1||mission.decisions?.station01?.completedAt||mission.completedStations?.length)return reject(res,400,'Start at Station 01');
 }
 if(record&&action==='poll'&&['COMPLETED','TIMED_OUT','ABANDONED'].includes(record.phase))return res.json({mission:project(record),revision:record.revision,device:{state:record.phase,missionId:id}});
 if(record&&action!=='poll'&&action!=='abandon'&&!(action==='sync'&&station==='1')&&Number(station)!==record.stage)return res.status(409).json({error:'Mission advanced',conflict:{mission:project(record),revision:record.revision,device:{state:record.phase,missionId:id}}});
 req.body={...req.body,deviceId:`solo-${tokenHash}`,missionId:id};
 req.url=`/stations/${(action==='poll'||action==='abandon')&&record?record.stage:station}/${action}`;
 independentContext.run({id,tokenHash},next);
};

// Reuse every existing station handler inside a per-mission slot namespace.
// The real booth stations, FIFO sequence, and other records are never replaced.
export function scopedTransaction(store,fn){
 const scope=independentContext.getStore();
 if(!scope)return store.transaction(fn);
 return store.scoped(scope.id,state=>{
  const record=state.missions[scope.id];
  // Recheck after queued cloud writes, not only before entering the transaction.
  if(record&&(record.mode!=='independent-v1'||record.accessHash!==scope.tokenHash))throw Object.assign(new Error('Mission access denied'),{status:403});
  const view={...state,missions:record?{[scope.id]:record}:{},stations:record?.independentSlots||{}};
  const result=fn(view),saved=view.missions[scope.id];
  if(saved){
   saved.mode='independent-v1';saved.accessHash=scope.tokenHash;saved.independentSlots=view.stations;
   if(saved.phase==='ACTIVE')resumeMissionTimer(saved);
   state.missions[scope.id]=saved;
   if(view.caseBag)state.caseBag=view.caseBag;
   if(result?.mission){result.mission=publicMission(saved);result.revision=saved.revision;result.device=view.stations[saved.stage];}
  }
  return result;
 });
}
