import {useEffect,useMemo,useState} from 'react';
import {LanguageProvider,useTranslation} from '../../locales/LanguageProvider.jsx';
import CyberMissionBrand from '../../components/CyberMissionBrand/CyberMissionBrand.jsx';
import FullscreenButton from '../../components/FullscreenButton/FullscreenButton.jsx';
import RankedList from './RankedList.jsx';
import {reconcileEntries} from './ranking.mjs';
import './LiveLeaderboard.css';
const copy={en:{title:'Leaderboard',sub:'Every decision makes a difference.',live:'Live',offline:'Reconnecting — showing last confirmed scores',loading:'Connecting…',empty:'The next mission starts with you.',wait:'Players appear after completing Station 01.',score:'POINTS',progress:'STATIONS',range:'Rankings',players:'participants'},ar:{title:'لوحة المتصدرين',sub:'كل قرار يصنع فرقًا.',live:'مباشر',offline:'جارٍ إعادة الاتصال — آخر نقاط مؤكدة',loading:'جارٍ الاتصال…',empty:'المهمة القادمة تبدأ معك.',wait:'يظهر المشاركون بعد إكمال المحطة 01.',score:'النقاط',progress:'المحطات',range:'المراكز',players:'مشاركًا'}};
export default function LiveLeaderboard(){const [language,setLanguage]=useState(new URLSearchParams(location.search).get('lang')==='en'?'en':'ar');return <LanguageProvider language={language}><Board setLanguage={value=>{const url=new URL(location.href);url.searchParams.set('lang',value);history.replaceState(null,'',url);setLanguage(value);}}/></LanguageProvider>;}
function Board({setLanguage}){
 const {language}=useTranslation(),c=copy[language];
 const [entries,setEntries]=useState([]);
 const rows=useMemo(()=>entries.map((entry,index)=>({...entry,rank:index+1})),[entries]);
 const hasPlayers=entries.length>0;
 useEffect(()=>{let stopped=false,timer,controller;
 if(import.meta.env.DEV){const preview=new URLSearchParams(location.search).get('leaderboardPreview');if(preview==='empty'||preview==='populated'){import('../../dev/leaderboardPreview.mjs').then(({previewEntries})=>{if(!stopped){setEntries(old=>reconcileEntries(old,previewEntries(preview)));}});return()=>{stopped=true;};}}
const poll=async()=>{controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5000);try{const response=await fetch('/api/booth/leaderboard',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Disconnected');const data=await response.json();if(!Array.isArray(data.entries))throw Error('Invalid snapshot');if(!stopped){setEntries(old=>reconcileEntries(old,data.entries));}}catch{/* Keep the last confirmed snapshot while reconnecting. */}finally{clearTimeout(timeout);if(!stopped)timer=setTimeout(poll,1500);}};poll();return()=>{stopped=true;clearTimeout(timer);controller?.abort();};},[]);
 return <main className={`leaderboard-screen${hasPlayers?' has-players':''}`} dir={language==='ar'?'rtl':'ltr'}><div className="lb-wallpaper" aria-hidden="true"/><header className="lb-header"><CyberMissionBrand variant="compact"/><div><button className="lb-language" onClick={()=>setLanguage(language==='ar'?'en':'ar')}>{language==='ar'?'English':'العربية'}</button><FullscreenButton/></div></header>
 {hasPlayers&&<section className="lb-content"><div className="lb-title"><h1>{c.title}</h1></div>
 <RankedList rows={rows} label={c.title} progressLabel={c.progress}/>
 <div className="lb-pagination"><span>{entries.length} {c.players}</span></div></section>}</main>;
}
