import {useEffect,useRef,useState} from 'react';
import {useMission} from '../context/MissionContext.jsx';
import {missionService} from '../services/missionService.js';
import {LanguageProvider} from '../locales/LanguageProvider.jsx';
import {independentRequest} from './independentApi.js';
import {nextPollDelay} from './http.js';
import Station01 from '../stations/Station01/Station01.jsx';
import Station02 from '../stations/Station02/Station02.jsx';
import Station03 from '../stations/Station03/Station03.jsx';
import Station04 from '../stations/Station04/Station04.jsx';

export default function IndependentSession({setup}){
 const {mission,saveMission,isLoaded,resetMission}=useMission();
 const latest=useRef({mission,saveMission});latest.current={mission,saveMission};
 const gate=useRef(false),epoch=useRef(0),published=useRef(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!isLoaded)return;
  let stopped=false,timer,failures=0;
  async function poll(){
   const current=missionService.getActiveMission(),version=epoch.current;
   if(current?.startedAt&&!gate.current){
    try{
     const signature=JSON.stringify([current.missionId,current.decisions?.station01,current.status]);
     const publish=current.currentStation===1&&published.current!==signature;
     const result=await independentRequest(publish?'sync':'poll',publish?{mission:current}:{},current);
     if(publish)published.current=signature;
     if(!stopped&&version===epoch.current){
      const pending=missionService.getActiveMission();
      if(result.mission&&(JSON.stringify(pending)===JSON.stringify(current)||result.mission.currentStation!==current.currentStation))latest.current.saveMission(result.mission);
      setError('');
     }
     failures=0;
    }catch(e){failures++;if(!stopped&&version===epoch.current){if(e.conflict?.mission){latest.current.saveMission(e.conflict.mission);localStorage.setItem(`cyberMission.independentRevision.${current.missionId}`,e.conflict.revision);}else setError(e.message);}}
   }
   if(!stopped)timer=setTimeout(poll,nextPollDelay(1000,failures));
  }
  poll();return()=>{stopped=true;clearTimeout(timer);};
 },[isLoaded]);
 async function action(endpoint,payload){
  if(gate.current)return false;
  gate.current=true;epoch.current++;setBusy(true);setError('');
  try{const result=await independentRequest(endpoint,payload);epoch.current++;saveMission(result.mission);return true;}
  catch(e){if(e.conflict?.mission){saveMission(e.conflict.mission);localStorage.setItem(`cyberMission.independentRevision.${mission.missionId}`,e.conflict.revision);}else setError(e.message);return false;}
  finally{gate.current=false;setBusy(false);}
 }
 if(!mission?.startedAt)return setup;
 const onExit=resetMission; // Detach this browser only; never erase the saved mission or other players.
 let content;
 if(mission.status==='timed-out')content=<main className="screen center-screen"><h1>{mission.language==='ar'?'انتهى وقت المهمة':'Mission time expired'}</h1><button className="primary-button" onClick={onExit}>{mission.language==='ar'?'العودة للرئيسية':'Back to Home'}</button></main>;
 else if(mission.currentStation===1)content=<Station01 mission={mission}/>;
 else if(mission.currentStation===2)content=<Station02 mission={mission} onDecision={(objectId,actionId)=>action('desk',{objectId,actionId})} onComplete={()=>action('desk',{complete:true})} {...{busy,error,onExit}}/>;
 else if(mission.currentStation===3)content=<Station03 mission={mission} onAction={(operation,itemId,selectedClassification)=>action('investigation',{action:operation,itemId,selectedClassification})} {...{busy,error,onExit}}/>;
 else content=<Station04 mission={mission} onAction={payload=>action('resolution',payload)} {...{busy,error,onExit}}/>;
 return <LanguageProvider language={mission.language}>{content}{error&&mission.currentStation===1&&<div className="booth-connection" role="alert">{error}</div>}</LanguageProvider>;
}
