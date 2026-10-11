import { useEffect, useRef, useState } from 'react';
import { useTranslation } from './LanguageProvider.jsx';
export default function LanguageSelector({onChange}){
 const {language,t}=useTranslation(),[open,setOpen]=useState(false),ref=useRef(null),trigger=useRef(null);
 useEffect(()=>{const close=event=>{if(!ref.current?.contains(event.target))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <div className="language-selector" ref={ref} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}}}>
  <button ref={trigger} type="button" aria-label={t('Language')} aria-expanded={open} onClick={()=>setOpen(!open)}>
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>
   <span>{language==='ar'?'العربية':'English'}</span><span aria-hidden="true">⌄</span>
  </button>
  {open&&<div className="language-options">{[['ar','العربية'],['en','English']].map(([value,label])=><button key={value} type="button" lang={value} aria-pressed={language===value} onClick={()=>{onChange(value);setOpen(false);trigger.current?.focus();}}>{label}</button>)}</div>}
 </div>;
}
