import { useLayoutEffect, useState } from 'react';
import { useTranslation } from '../../locales/LanguageProvider.jsx';
import { INVESTIGATION_APPS, participantRecords } from '../../../../shared/station03Content.mjs';
import GameplayHud from "../../components/MissionTopBar/GameplayHud.jsx";
import WorkstationWindow, { DesktopIcon } from './WorkstationWindow.jsx';
import './Station03.css';
import DocumentViewer from './DocumentViewer.jsx';
import StationCompletion from '../../components/StationCompletion/StationCompletion.jsx';
import ClassificationPhase from './ClassificationPhase.jsx';
import {workstationRecord} from './workstationPresentation.js';


export default function Station03({mission,onAction,onExit,busy=false,error='',completed=false}) {
 const {t,language}=useTranslation();
 // Window state is presentation only. Investigation selections remain backend-owned.
 const [windows,setWindows]=useState([]),[launcher,setLauncher]=useState(false);
 const [appSearch,setAppSearch]=useState('');
 const display=value=>typeof value==='object'?value[language]||value.ar:value;
 const apps=mission.investigationCase?[...INVESTIGATION_APPS,['activity',{en:'Recent Activity',ar:'\u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0623\u062e\u064a\u0631'}]]:INVESTIGATION_APPS;
 const records=(mission.station03Experience?.records||participantRecords(mission)).map(workstationRecord),selected=mission.decisions?.station03?.selectedIds||[];
 const inChallenge=mission.decisions?.station03?.phase==='classification';
 useLayoutEffect(()=>{
  if(!inChallenge)return;
  setLauncher(false);
  setAppSearch('');
  setWindows(all=>all.filter(win=>win.id==='financial'));
 },[inChallenge]);
 const evidenceAction=(action,...args)=>inChallenge?(action==='inspect'?Promise.resolve(true):Promise.resolve(false)):onAction(action,...args);
 const fileRecords=records;

 const appName=id=>id==='financial'?(language==='ar'?'مراجعة البيانات':'Data review'):id.startsWith('pdf:')?display(fileRecords.find(r=>r.id===id.slice(4))?.title||'PDF'): id==='case'?t('Evidence File'):display(apps.find(([key])=>key===id)?.[1]||'');
 const update=(id,patch)=>setWindows(all=>all.map(w=>w.id===id?{...w,...patch}:w));
 const focus=id=>setWindows(all=>{const w=all.find(w=>w.id===id);return w?[...all.filter(w=>w.id!==id),w]:all;});
 function open(id){setLauncher(false);setAppSearch('');setWindows(all=>{const existing=all.find(w=>w.id===id);return [...all.filter(w=>w.id!==id),existing?{...existing,minimized:false}:{id,minimized:false,maximized:false,itemId:null,slot:all.length%3}];});}
 function taskbarOpen(id){const win=windows.find(w=>w.id===id);if(win&&!win.minimized&&windows.at(-1)?.id===id)update(id,{minimized:true});else open(id);}
 async function openDocument(row){if(await evidenceAction('inspect',row.id))open('pdf:'+row.id);}
 const close=id=>setWindows(all=>all.filter(w=>w.id!==id));
 const stamp=value=>new Date(value).toLocaleString(language==='ar'?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
 return <main className={completed?'screen station-screen station01-screen':'workstation-screen'}>
  <header className="mission-topbar workstation-topbar"><GameplayHud mission={mission} currentStation={3} onExit={onExit}/></header>
  {completed?<StationCompletion mission={mission} stationNumber={3}/>:<div className={`workstation-layout${inChallenge?' in-classification':''}`}>
   <section className="workstation-desktop" aria-label={t('Digital Investigation')}>
    <div className="desktop-surface">

      <nav className="desktop-apps" aria-label={t('Workstation applications')}>{apps.map(([id,name])=><button key={id} onClick={()=>open(id)}><DesktopIcon name={id}/><span>{display(name)}</span></button>)}{inChallenge&&<button onClick={()=>open('financial')}><DesktopIcon name="mail"/><span>{appName('financial')}</span></button>}</nav>
      {windows.filter(win=>win.id!=='financial').map(win=>{const index=windows.findIndex(w=>w.id===win.id);return win.id.startsWith('pdf:')?<DocumentViewer key={win.id} win={win} active={index===windows.length-1} document={fileRecords.find(r=>r.id===win.id.slice(4))} selected={selected} busy={busy} onAction={evidenceAction} evidenceLocked={inChallenge} zIndex={index+1} onFocus={()=>focus(win.id)} onClose={()=>close(win.id)} onMinimize={()=>update(win.id,{minimized:true})} onMaximize={()=>update(win.id,{maximized:!win.maximized})}/>:<WorkstationWindow key={win.id} win={win} onOpenDocument={openDocument} zIndex={index+1} active={index===windows.length-1} title={appName(win.id)} apps={apps} records={win.id==='case'?records.filter(item=>selected.includes(item.id)):fileRecords.filter(item=>item.source===win.id)} selected={selected} classifications={mission.decisions?.station03?.classifications||{}} busy={busy} onAction={evidenceAction} evidenceLocked={inChallenge} onFocus={()=>focus(win.id)} onClose={()=>close(win.id)} onMinimize={()=>update(win.id,{minimized:true})} onMaximize={()=>update(win.id,{maximized:!win.maximized})} onSelect={id=>update(win.id,{itemId:id})} open={open} appName={appName} display={display} stamp={stamp}/>;})}
      {inChallenge&&<ClassificationPhase mission={mission} onAction={onAction} busy={busy} error={error} win={windows.find(w=>w.id==='financial')} zIndex={windows.findIndex(w=>w.id==='financial')+1} onFocus={()=>focus('financial')} onClose={()=>close('financial')} onMinimize={()=>update('financial',{minimized:true})}/>}
      {launcher&&<nav className="desktop-launcher" aria-label={t('Workstation applications')} onKeyDown={e=>{if(e.key==='Escape')setLauncher(false);}}><label className="workstation-search"><DesktopIcon name="search"/><input autoFocus value={appSearch} onChange={e=>setAppSearch(e.target.value)} placeholder={t('Find an application')} aria-label={t('Find an application')}/></label><strong>{t('Applications')}</strong><div>{apps.filter(([id])=>appName(id).toLocaleLowerCase().includes(appSearch.toLocaleLowerCase())).map(([id])=><button key={id} onClick={()=>open(id)}><DesktopIcon name={id}/>{appName(id)}</button>)}</div></nav>}

     {error&&<p className="workstation-error" role="alert">{t(error)}</p>}
    </div>
    <footer className="desktop-taskbar">
     <div className="taskbar-launch"><button aria-label={t('Start menu')} aria-expanded={launcher} onClick={()=>setLauncher(!launcher)}><DesktopIcon name="grid"/></button><button className="taskbar-search" onClick={()=>setLauncher(!launcher)}><DesktopIcon name="search"/><span>{t('Applications')}</span></button></div>
     <div className="desktop-running">{['documents','mail',...windows.map(w=>w.id).filter(id=>!['documents','mail'].includes(id))].map(id=><button key={id} title={appName(id)} aria-label={appName(id)} className={`${windows.some(w=>w.id===id)?'is-running':''} ${windows.at(-1)?.id===id&&!windows.at(-1)?.minimized?'is-active':''}`} onClick={()=>taskbarOpen(id)}><DesktopIcon name={id}/></button>)}</div>
     <div className="desktop-tray"><span>{language==='ar'?'ARA':'ENG'}</span><DesktopIcon name="wifi"/><DesktopIcon name="volume"/><time><span>{new Date(mission.startedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span><span>{new Date(mission.startedAt).toLocaleDateString('en-GB')}</span></time></div>
    </footer>
   </section>
   <footer className="workstation-mission-footer mission-control-footer">
    <div className="workstation-footer-identity"><span>{t('Station')} <bdi>03</bdi></span><h1>{t('Digital Investigation')}</h1></div>
    <button className="workstation-footer-evidence" onClick={()=>open('case')}><DesktopIcon name="case"/><span>{language==='ar'?t('Collected Evidence'):'Evidence Collected'}</span><bdi>{selected.length}</bdi><small>{t('items')}</small></button>
    {mission.decisions?.station03?.phase==='classification'?<button className="workstation-scenario-status" onClick={()=>open('financial')}><span>{t('Scenario in progress')}</span><bdi>{mission.decisions.station03.dataDecisions?.answers?Object.keys(mission.decisions.station03.dataDecisions.answers).length:0} / 3</bdi></button>:<button className="investigation-complete mission-primary-action" disabled={busy||!onAction} onClick={()=>onAction('begin-classification')}><span>{t('Finish Investigation')}</span><span aria-hidden="true">{language==='ar'?'←':'→'}</span></button>}
   </footer>
  </div>}
 </main>;
}
