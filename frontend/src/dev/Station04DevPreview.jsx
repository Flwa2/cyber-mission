import {useEffect,useRef,useState} from 'react';
import Station04 from '../stations/Station04/Station04.jsx';
import {LanguageProvider} from '../locales/LanguageProvider.jsx';
import {PREVIEW_STORAGE_KEY,normalizePreviewPhase,previewPhase,createPreviewRecord,restorePreviewRecord,applyPreviewAction,previewMission} from './station04Preview.mjs';

function initialRecord(){
 const params=new URLSearchParams(location.search);
 let existingLanguage;
 try{existingLanguage=JSON.parse(localStorage.getItem('cyberMission.activeMission'))?.language;}catch{/* Read-only language fallback. */}
 const requested=params.get('lang')||existingLanguage;
 const language=requested==='en'?'en':'ar',phase=normalizePreviewPhase(params.get('phase'));
 const seed=params.get('seed')||'preview-default';
 try{return restorePreviewRecord(sessionStorage.getItem(PREVIEW_STORAGE_KEY),language,phase,seed);}catch{return createPreviewRecord(language,phase,undefined,{seed});}
}

// State adapter only: all visuals, controls and interactions render through the real Station04.
export default function Station04DevPreview(){
 const [record,setRecord]=useState(initialRecord),recordRef=useRef(record);
 const [error,setError]=useState('');
 useEffect(()=>{
  try{sessionStorage.setItem(PREVIEW_STORAGE_KEY,JSON.stringify(record));}catch{/* Preview still works in memory if storage is disabled. */}
  const url=new URL(location.href);
  url.searchParams.set('phase',previewPhase(record));url.searchParams.set('lang',record.mission.language);
  history.replaceState(history.state,'',url);
 },[record]);
 function act(payload){
  try{const next=applyPreviewAction(recordRef.current,payload);recordRef.current=next;setRecord(next);setError('');return Promise.resolve(true);}
  catch(e){setError(e.message);return Promise.resolve(false);}
 }
 function reset(){const next=createPreviewRecord(record.mission.language,record.vaultAssignment?'vault':'intro',undefined,{seed:record.previewSeed,assignment:record.mission.narrativeAssignment});recordRef.current=next;setRecord(next);setError('');}
 return <LanguageProvider language={record.mission.language}><Station04 key={record.mission.createdAt} mission={previewMission(record)} onAction={act} onExit={reset} error={error}/></LanguageProvider>;
}
