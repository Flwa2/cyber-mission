import StationDeviceWaiting, {waitingStationTitle} from './StationDeviceWaiting.jsx';
import { useEffect, useRef, useState } from 'react';
import CyberMissionBrand from '../components/CyberMissionBrand/CyberMissionBrand.jsx';
import FullscreenButton from '../components/FullscreenButton/FullscreenButton.jsx';
import MissionTimer from '../components/MissionTimer/MissionTimer.jsx';
import { stationNumber, stationRequest } from './boothApi.js';
import { nextPollDelay } from './http.js';
import './booth.css';
import Station02 from '../stations/Station02/Station02.jsx';
import Station04 from '../stations/Station04/Station04.jsx';
import Station03 from '../stations/Station03/Station03.jsx';
import useDeviceHeartbeat from './useDeviceHeartbeat.js';
import MissionIcon from '../components/MissionIcon/MissionIcon.jsx';
import { LanguageProvider, useTranslation } from '../locales/LanguageProvider.jsx';

function LeaveFullscreenButton(){
 const {t}=useTranslation();
 const [active,setActive]=useState(Boolean(document.fullscreenElement));
 useEffect(()=>{const sync=()=>setActive(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync);},[]);
 return <button type="button" className="topbar-window-button booth-leave-fullscreen" aria-label={t('Leave fullscreen')} title={t(active?'Leave fullscreen':'Already outside fullscreen')} disabled={!active} onClick={()=>document.exitFullscreen?.().catch(()=>{})}><MissionIcon name="close"/></button>;
}
export default function StationDevice(){
 const [snapshot,setSnapshot]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const mutation=useRef(0),inFlight=useRef(false);
 useDeviceHeartbeat(snapshot?.device?.missionId);
 useEffect(()=>{
  if(snapshot?.device.state!=='ACTIVE'||!snapshot.mission?.missionId||inFlight.current)return;
  let stopped=false;
   mutation.current++;
   inFlight.current=true;
  stationRequest('activate',{missionId:snapshot.mission.missionId}).then(data=>{
   if(!stopped){mutation.current++;setSnapshot(data);}
  }).catch(e=>{if(!stopped)setError(e.message);}).finally(()=>{inFlight.current=false;});
  return()=>{stopped=true;};
 },[snapshot?.device.state,snapshot?.mission?.missionId]);
 useEffect(()=>{let stopped=false,timer,failures=0;async function poll(){const version=mutation.current;try{const data=await stationRequest('poll');failures=0;if(!stopped&&version===mutation.current){setSnapshot(data);setError('');}}catch(e){failures++;if(!stopped&&version===mutation.current){setError(e.message);}}if(!stopped)timer=setTimeout(poll,nextPollDelay(900,failures));}poll();return()=>{stopped=true;clearTimeout(timer);};},[]);
 async function complete(){setBusy(true);try{await stationRequest('complete-placeholder',{missionId:snapshot.mission.missionId});setSnapshot({...snapshot,device:{...snapshot.device,state:'RESETTING'}});}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function deskAction(payload, endpoint='desk'){
  if(inFlight.current)return false;
  inFlight.current=true;mutation.current++;setBusy(true);setError('');
  try{
   const data=await stationRequest(endpoint,{missionId:snapshot.mission.missionId,revision:snapshot.revision,...payload});
   mutation.current++;setSnapshot(data);return true;
  }catch(e){
   mutation.current++;
   if(e.status===409){
    try{const data=e.conflict?.device?e.conflict:await stationRequest('poll');mutation.current++;setSnapshot(data);setError('');}
    catch(refreshError){setError(refreshError.message);}
   }else setError(e.message);
   return false;
  }finally{inFlight.current=false;setBusy(false);}
 }
 async function exitDesk(){
  mutation.current++;
  try{
   const left=await stationRequest('abandon',{missionId:snapshot.mission.missionId}).catch(e=>{if(e.transient)throw e;return null;});
   if(!left?.abandoned)await stationRequest('release',{missionId:snapshot.mission.missionId,immediate:true});
   mutation.current++;setSnapshot(await stationRequest('poll'));
  }catch(e){setError(e.message);throw e;}
 }
 const state=snapshot?.device.state, mission=snapshot?.mission;
 return <LanguageProvider language={mission?.language || new URLSearchParams(location.search).get('lang')}><StationDeviceView {...{state,mission,deskAction,exitDesk,busy,error,complete}}/></LanguageProvider>;
}
function StationDeviceView({state,mission,deskAction,exitDesk,busy,error,complete}){
 const {t}=useTranslation();
 if(stationNumber===4&&mission?.status!=='timed-out'&&mission?.caseFile&&['ACTIVE','RESETTING'].includes(state))return <Station04 key={mission.missionId} mission={mission} onAction={payload=>deskAction(payload,'resolution')} onExit={exitDesk} busy={busy} error={error} resetting={state==='RESETTING'}/>;
 if(stationNumber===3&&mission?.status!=='timed-out'&&mission&&['ACTIVE','RESETTING'].includes(state))return <Station03 key={mission.missionId} mission={mission} onAction={(action,itemId,selectedClassification)=>deskAction({action,itemId,selectedClassification},'investigation')} onExit={exitDesk} busy={busy} error={error} completed={state==='RESETTING'}/>;
 if(mission?.status==='timed-out')return <main className="booth-screen"><header><CyberMissionBrand variant="compact"/><MissionTimer startedAt={mission.startedAt} timer={mission.timer}/><FullscreenButton/></header><section className="station-timeout-card"><p className="eyebrow">{t("Mission Time Expired")}</p><h1>{t("Your current mission session has ended.")}</h1><p>{t("Preparing station for the next participant...")}</p></section></main>;
 if(stationNumber===2&&mission&&['ACTIVE','RESETTING'].includes(state))return <Station02 key={mission.missionId} mission={mission} onDecision={(objectId,actionId)=>deskAction({objectId,actionId})} onComplete={()=>deskAction({complete:true})} onExit={exitDesk} busy={busy} error={t(error)} completed={state==='RESETTING'}/>;
 return <main className="booth-screen booth-terminal"><header className="booth-terminal-header"><CyberMissionBrand variant="compact"/><div className="booth-terminal-controls"><span className="booth-terminal-station">{t("STATION")} {String(stationNumber).padStart(2,"0")}</span>{mission&&<><span>{mission.missionId}</span><MissionTimer startedAt={mission.startedAt} timer={mission.timer}/></>}<FullscreenButton/><LeaveFullscreenButton/></div></header>
 <section className="booth-device-content"><p className="eyebrow">{t("STATION")} {String(stationNumber).padStart(2,"0")} · {waitingStationTitle(stationNumber,t)}</p>
 {error?<><h1>{t("CONNECTION PAUSED")}</h1><p role="alert">{t(error)}</p></>:state==='CLAIMING'?<><h1>{t("MISSION INCOMING")}</h1><p>{t("STATION")} {String(stationNumber-1).padStart(2,"0")} {t("COMPLETE")} &#10003;</p><p>{t("PREPARING STATION")} {String(stationNumber).padStart(2,"0")}...</p></>:state==='ACTIVE'?<><h1>{t("STATION")} {String(stationNumber).padStart(2,"0")} {t("PLACEHOLDER")}</h1><p>{t("Synchronization test station")}</p><button disabled={busy} onClick={complete}>{t("FINISH TEST HANDOFF")} →</button></>:state==='RESETTING'?<><h1>{t("HANDOFF RECORDED")}</h1><p>{t("Preparing for the next mission...")}</p></>:<>
 <StationDeviceWaiting station={stationNumber}/>
 </>}
 </section></main>;
}
