import { useTranslation } from "../../locales/LanguageProvider.jsx";
import { useEffect, useRef, useState } from 'react';
import GameplayHud from "../../components/MissionTopBar/GameplayHud.jsx";
import MissionIcon from '../../components/MissionIcon/MissionIcon.jsx';
import { localizeDisplay } from "../../locales/translate.js";
import { DESK_OBJECTS, MIN_DESK_DECISIONS } from '../../../../shared/deskObjects.mjs';
import './Station02.css';
import StationCompletion from '../../components/StationCompletion/StationCompletion.jsx';
import { DESK_ART, DESK_HOTSPOTS } from './deskScene.js';

export default function Station02({ mission, onDecision, onComplete, onExit, busy=false, error='', completed=false }) {
  const { t, language } = useTranslation();
  const display=value=>typeof value==='object'?value[language]||value.en:t(value);
  const objects=localizeDisplay(DESK_OBJECTS,language).map(object=>({
    ...object,details:mission.caseFile?.physicalClues?.[object.id]?.map(([label,value])=>[display(label),display(value)])||object.details
  }));
  const sceneRef=useRef(null);
  const [size,setSize]=useState({width:0,height:0});
  const [selected,setSelected]=useState(null);
  const [notice,setNotice]=useState('');
  const items=mission.decisions?.station02?.items||{};
  const count=Object.keys(items).length;
  const item=objects.find(item=>item.id===selected);
  useEffect(()=>{
    if(!sceneRef.current)return;
    const observer=new ResizeObserver(([entry])=>{
      const bounds=entry.contentRect;
      const scale=Math.max(bounds.width/DESK_ART.width,bounds.height/DESK_ART.height);
      const width=DESK_ART.width*scale, height=DESK_ART.height*scale;
      setSize({width,height,left:(bounds.width-width)*DESK_ART.focalX,top:(bounds.height-height)*DESK_ART.focalY});
    });
    observer.observe(sceneRef.current);return()=>observer.disconnect();
  },[completed]);
  useEffect(()=>{setSelected(null);setNotice('');},[mission.missionId]);
  useEffect(()=>{if(completed){setSelected(null);}},[completed]);
  async function choose(actionId){
    if(await onDecision(item.id,actionId)){setNotice(t("Decision Recorded"));setSelected(null);}
  }
  return <main className={completed?"screen station-screen station01-screen":"desk-screen"}>
    {completed&&<div className="incident-room" aria-hidden="true"><div className="room-monitor"/><div className="room-beacon"/><div className="room-glass"/><div className="room-desk"/></div>}
    <header className="mission-topbar desk-topbar"><GameplayHud mission={mission} currentStation={2} onExit={onExit}/></header>
    {completed?<StationCompletion mission={mission} stationNumber={2}/>:<>
    <section className="desk-stage" ref={sceneRef} aria-label={t("The desk investigation")}>
      <div className="desk-image-plane" style={size}>
        <img className="desk-art" src="/assets/station02-desk-final.png" alt={t("A colleague's desk with documents, a USB drive, access badge, cable, coffee card and power bank")} draggable="false"/>
        {!completed&&objects.map(object=><button key={object.id} className={`desk-hotspot ${items[object.id]?'is-recorded':''} ${selected===object.id?'is-selected':''}`} style={{left:`${DESK_HOTSPOTS[object.id].x}%`,top:`${DESK_HOTSPOTS[object.id].y}%`}} aria-label={t("Inspect")+" "+object.name} aria-pressed={selected===object.id} onClick={()=>{setSelected(object.id);setNotice('');}}><span aria-hidden="true"/></button>)}
      </div>
      {!completed&&<aside className={`desk-intro ${item?'has-selection':''}`}><p className="eyebrow">{t("STATION 02")}</p><h1>{t("Incident Desk")}</h1><p className="desk-lead">{t("This desk has been identified within the incident area.")}</p><p>{t("Inspect the items and make your decisions carefully.")}</p><ol><li><span>01</span>{t("Select an item")}</li><li><span>02</span>{t("Inspect it")}</li><li><span>03</span>{t("Choose an action")}</li></ol><p className="desk-tip"><span>{t("TIP")}</span>{t("Look closely. Not everything here is what it seems.")}</p></aside>}
      {!completed&&item&&<aside className="desk-inspector" aria-label={t("ITEM INSPECTION")+": "+item.name} onKeyDown={e=>{if(e.key==='Escape')setSelected(null);}}>
        <header><div><p className="eyebrow">{t("ITEM INSPECTION")}</p><h2>{item.name}</h2></div><button className="panel-close" aria-label={t("Close inspection")} onClick={()=>setSelected(null)}><MissionIcon name="close"/></button></header>
        <dl>{item.details.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {items[item.id]?<div className="desk-recorded"><p>{t("DECISION RECORDED")}</p><strong>{item.actions.find(([id])=>id===items[item.id].actionId)?.[1]}</strong><p>{t("Select another item to continue.")}</p></div>:<><p className="desk-question">{t("What would you do?")}</p><div className="desk-actions">{item.actions.map(([id,label])=><button key={id} disabled={busy} onClick={()=>choose(id)}><span>{label}</span><span aria-hidden="true">{t("→")}</span></button>)}</div></>}
      </aside>}
      {error&&<p className="desk-error" role="alert">{t(error)} {t("Your saved decisions are retained.")}</p>}
    </section>
    <footer className="desk-footer mission-control-footer"><div className="desk-progress"><span>{t("ITEMS INSPECTED")} <strong><bdi>{count} / 6</bdi></strong></span><div aria-hidden="true">{objects.map(object=><i key={object.id} className={items[object.id]?'filled':''}/>)}</div></div><p className="desk-notice" role="status">{t(completed?'DECISIONS RECORDED':busy?'Saving decision...':notice||'LOOK \u2192 INSPECT \u2192 DECIDE')}</p><div className="desk-continue"><button className="mission-primary-action" disabled={count<MIN_DESK_DECISIONS||busy||completed} onClick={onComplete}><span>{t("CONTINUE MISSION")}</span><span aria-hidden="true">{language==='ar'?'←':'→'}</span></button><small>{t(count<MIN_DESK_DECISIONS?'Make decisions on at least 3 items to continue.':'')}</small></div></footer>
    </>}
  </main>;
}
