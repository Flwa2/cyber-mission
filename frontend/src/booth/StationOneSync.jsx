import { useEffect, useRef, useState } from 'react';
import { useMission } from '../context/MissionContext.jsx';
import { missionService } from '../services/missionService.js';
import { stationRequest } from './boothApi.js';
import { nextPollDelay } from './http.js';
import './booth.css';
import useDeviceHeartbeat from './useDeviceHeartbeat.js';
import { translate } from '../locales/translate.js';

export default function StationOneSync(){
 const {mission,isLoaded,saveMission,detachMission}=useMission();
 const t=value=>translate(value,mission?.language);
 useDeviceHeartbeat(mission?.startedAt ? mission.missionId : null);
 const latest=useRef({saveMission,detachMission});latest.current={saveMission,detachMission};
 const [error,setError]=useState('');
 const activating=useRef(null);
 useEffect(()=>{
  if(!isLoaded)return;
  let stopped=false,timer,failures=0;
  const key=id=>`cyberMission.syncedRevision.${id}`;
  const remember=(id,value)=>localStorage.setItem(key(id),String(value));
  const adopt=(saved,revision)=>{
   if(stopped||missionService.getActiveMission()?.missionId!==saved.missionId)return;
   remember(saved.missionId,revision);
   latest.current.saveMission(saved);
  };
  async function synchronize(){
   if(stopped)return;
   // Read inside the cross-tab lock, not from a stale React closure.
   const current=missionService.getActiveMission();
   try{
    if(current?.startedAt){
     const version=Number(localStorage.getItem(key(current.missionId))??sessionStorage.getItem(`cyberMission.revision.${current.missionId}`)??0);
     const sent=JSON.stringify(current);
     const result=await stationRequest('sync',{mission:current,revision:version});
     if(stopped)return;
     remember(current.missionId,result.revision);
     const pending=missionService.getActiveMission();
     // Do not erase a newer local action made while this request was pending.
     // A finalized station always wins over late local interactions.
     if(result.mission&&(JSON.stringify(pending)===sent||result.mission.currentStation>1||result.mission.status==='timed-out'))adopt(result.mission,result.revision);
     if(result.mission?.currentStation===1&&result.mission?.status==='active'&&activating.current!==result.mission.missionId){
      activating.current=result.mission.missionId;
      const active=await stationRequest('activate',{missionId:result.mission.missionId});
      if(!stopped)adopt(active.mission,active.revision);
     }
     if(result.resetAt&&Date.now()>=result.resetAt&&missionService.getActiveMission()?.missionId===current.missionId){
      await stationRequest('release',{missionId:current.missionId});
      if(!stopped)latest.current.detachMission(current.missionId);
     }
    }else if(!current){
     const result=await stationRequest('poll');
     if(!stopped&&!missionService.getActiveMission()&&result.mission){
      remember(result.mission.missionId,result.revision);
      latest.current.saveMission(result.mission);
     }
    }
    if(!stopped)setError('');
    failures=0;
   }catch(e){
    failures++;
    if(stopped)return;
    if(e.status===409&&e.conflict?.mission){
     // Stale writes are rejected by the server, never replayed with a new
     // revision. All tabs adopt the accepted decisions and can continue.
     adopt(e.conflict.mission,e.conflict.revision);setError('');
    }else setError(e.message);
   }
  }
  async function tick(){
   if(navigator.locks)await navigator.locks.request('cyberMission.station01.sync',synchronize);
   else await synchronize();
   if(!stopped)timer=setTimeout(tick,nextPollDelay(1000,failures));
  }
  tick();return()=>{stopped=true;clearTimeout(timer);};
 },[isLoaded]);
 return error?<div className="booth-connection" role="alert"><div><p>{t('Connection paused')} ? {t(error)}. {t('Retrying; mission remains on this device.')}</p></div></div>:null;
}
