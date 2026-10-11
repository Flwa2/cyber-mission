import {useEffect,useRef,useState} from 'react';
import {useTranslation} from '../../locales/LanguageProvider.jsx';
import './Vault.css';

const digits=value=>value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
export default function Vault({vault,onAction,busy,error}){
 const {language}=useTranslation(),ar=language==='ar',copy=(en,arabic)=>ar?arabic:en,display=v=>v?.[language]||v?.en||v||'';
 const [code,setCode]=useState(''),[angle,setAngle]=useState(0),[pending,setPending]=useState(false),[clock,setClock]=useState(Date.now());
 const [source,setSource]=useState(null),[opening,setOpening]=useState(false),[keypad,setKeypad]=useState(false),[panel,setPanel]=useState(null),[confirmLevel,setConfirmLevel]=useState(null);
 const dialog=useRef(null),audio=useRef(null),request=useRef(null),lock=useRef(false),wasUnlocked=useRef(Boolean(vault.unlockedAt));
 const blocked=busy||pending,remaining=Math.max(0,Math.ceil((Date.parse(vault.cooldownUntil)||0)-clock)/1000);
 useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),250);return()=>clearInterval(id);},[]);
 useEffect(()=>()=>{audio.current?.close().catch(()=>{});},[]);
 useEffect(()=>{if(source&&!dialog.current.open)dialog.current.showModal();else if(!source&&dialog.current.open)dialog.current.close();},[source]);
 useEffect(()=>{
  if(vault.unlockedAt&&!wasUnlocked.current){setOpening(true);const id=setTimeout(()=>setOpening(false),900);wasUnlocked.current=true;return()=>clearTimeout(id);}
 },[vault.unlockedAt]);
 function clickSound(){
  try{
   const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
   const context=audio.current ||= new Context();context.resume().catch(()=>{});
   for(const delay of [0,.07,.14]){const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
    oscillator.type='triangle';oscillator.frequency.setValueAtTime(1100,at);oscillator.frequency.exponentialRampToValueAtTime(180,at+.025);
    gain.gain.setValueAtTime(.025,at);gain.gain.exponentialRampToValueAtTime(.001,at+.03);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(at);oscillator.stop(at+.035);}
  }catch{/* Audio is optional when browser/device policy disallows it. */}
 }
 function enter(digit){
  if(blocked||vault.unlockedAt||code.length===4)return;
  const clockwise=code.length%2===0,target=(360-Number(digit)*36)%360;
  setAngle(prior=>{const current=((prior%360)+360)%360;return prior+(clockwise?360+(target-current+360)%360:-360-(current-target+360)%360);});
  setCode(code+digit);clickSound();
 }
 async function act(payload){
  if(lock.current||busy||!onAction)return;
  lock.current=true;setPending(true);
  const key=JSON.stringify(payload);
  if(request.current?.key!==key)request.current={key,body:{...payload,requestId:globalThis.crypto?.randomUUID?.()||`vault-${Date.now()}-${Math.random().toString(36).slice(2)}`}};
  try{if(await onAction(request.current.body)){request.current=null;setCode('');}}finally{lock.current=false;setPending(false);}
 }
 useEffect(()=>{
  function key(event){
   if(source||vault.unlockedAt||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
   const value=digits(event.key);
   if(/^\d$/.test(value)){event.preventDefault();enter(value);}
   else if(event.key==='Backspace'){event.preventDefault();if(!blocked)setCode(c=>c.slice(0,-1));}
   else if(event.key==='Enter'&&event.target.tagName!=='BUTTON'&&code.length===4&&!remaining){event.preventDefault();act({action:'vault-attempt',code});}
  }
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[source,vault.unlockedAt,code,blocked,remaining]);
 const documents=vault.references.documents||[vault.references.document].filter(Boolean);
 const selected=source?.startsWith('document-')?documents[Number(source.slice(9))]:null;
 const nextAward={1:500,2:300,3:50}[confirmLevel];
 const errors={'Please wait before trying again':copy('Please wait before trying again.','يرجى الانتظار قبل المحاولة مجددًا.'),'Enter four digits':copy('Enter four digits.','أدخل أربعة أرقام.'),'Mission time expired':copy('Mission time has expired.','انتهى وقت المهمة.')};
 return <section className={`vault-workspace${vault.unlockedAt?' is-unlocked':''}${opening?' is-opening':''}`} aria-labelledby="vault-title" dir={ar?'rtl':'ltr'}>
  <div className="vault-visual"><div className="vault-frame">
  <div className="vault-art" aria-hidden="true">
   <img className="vault-background" src="/assets/vault-background.png" alt="" draggable="false"/>
   <div className="vault-dial-placement"><div className="vault-dial-rotor" style={{transform:`rotate(${angle}deg)`}}><img src="/assets/vault-dial.png" alt="" draggable="false"/></div></div>
   <div className="vault-unlock-light"/>
  </div>
  <div className="vault-controls">
   <p className="vault-eyebrow">{copy('STATION 04 · PROTECTED ARCHIVE','المحطة 04 · الأرشيف المحمي')}</p>
   <h1 id="vault-title">{copy(vault.unlockedAt?'Archive unlocked':'Open the archive',vault.unlockedAt?'تم فتح الأرشيف':'افتح الأرشيف')}</h1>
   {!vault.unlockedAt&&<>
    <p className="vault-intro">{copy('Connect the correspondence with the working documents. Enter the four-digit combination.','اربط المراسلات بمستندات العمل، ثم أدخل الرمز المكوّن من أربعة أرقام.')}</p>
    <div className="vault-code" dir="ltr" role="group" aria-label={copy('Four-digit code','رمز من أربعة أرقام')} tabIndex={0} onPointerDown={event=>{if(event.pointerType==='touch'||event.pointerType==='pen')setKeypad(true);}}>{[0,1,2,3].map(i=><span key={i} className={code.length===i?'is-active':''}>{code[i]??''}</span>)}</div>
    <button className="vault-primary" disabled={blocked||code.length!==4||remaining>0} onClick={()=>act({action:'vault-attempt',code})}>{copy('UNLOCK ARCHIVE','فتح الأرشيف')}</button>
    <p className="vault-status" role="status">{remaining>0?copy(`Try again in ${Math.ceil(remaining)}s`,`يمكنك المحاولة بعد ${Math.ceil(remaining)} ث`):vault.lastAttempt==='incorrect'?copy('That combination did not open the archive.','لم يفتح هذا الرمز الأرشيف.'):''}</p>
   </>}
   {error&&<p className="vault-error" role="alert">{errors[error]||copy('The request could not be completed. Please try again.','تعذّر إكمال الطلب. يرجى المحاولة مجددًا.')}</p>}
  </div>
  </div></div>
  <div className="vault-corner vault-corner-left">
   <button className="vault-tool" aria-expanded={panel==='evidence'} onClick={()=>{setConfirmLevel(null);setPanel(p=>p==='evidence'?null:'evidence')}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v5M6 3v18h6M14 3v4h4M9 9h4M9 13h2"/><circle cx="16" cy="17" r="3"/><path d="m18.5 19.5 2.5 2.5"/></svg><span>{copy('Review evidence','مراجعة الأدلة')}</span></button>
   {panel==='evidence'&&<div className="vault-popover"><span>{copy('Archive documents','مستندات الأرشيف')}</span>{documents.map((item,index)=><button key={item.id||index} onClick={()=>{setPanel(null);setSource(`document-${index}`);}}><bdi>{display(item.title)}</bdi></button>)}</div>}
  </div>
  {!vault.unlockedAt&&<div className="vault-corner vault-corner-right">
   <button className="vault-tool" aria-expanded={panel==='hint'} onClick={()=>setPanel(p=>p==='hint'?null:'hint')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.6 1.5 2.6v.5h4v-.5c0-1 .6-1.9 1.5-2.6A6 6 0 0 0 12 3Z"/></svg><span>{copy('Hint','تلميح')}</span>{vault.hintLevel>0&&<b className="vault-badge">{vault.hintLevel}</b>}</button>
   {panel==='hint'&&<div className="vault-popover vault-hints">
    {!confirmLevel&&<><p>{copy(`Vault score: ${vault.awardAvailable??600}/600. Hints reduce this score.`,`نقاط الخزنة: ${vault.awardAvailable??600}/600. التلميحات تخصم من النقاط.`)}</p>
     {vault.hintLevel>=1&&<p>{copy('The required file is: ','الملف المطلوب هو: ')}<bdi>{display(documents[0]?.title)}</bdi></p>}
     {vault.hintLevel>=2&&<p>{copy('Use the review reference found inside the document.','استخدم مرجع المراجعة الموجود داخل الملف.')}</p>}
     {vault.hintLevel<3&&<button disabled={blocked} onClick={()=>setConfirmLevel(vault.hintLevel+1)}>{vault.hintLevel===0?copy('Use Hint 1 · 100 points','استخدام التلميح 1 · خصم 100 نقطة'):vault.hintLevel===1?copy('Use Hint 2 · 200 points','استخدام التلميح 2 · خصم 200 نقطة'):copy('Reveal code · 250 points','إظهار الرمز · خصم 250 نقطة')}</button>}
    </>}
    {confirmLevel&&<div className="vault-inline-confirm">
     <p>{copy(`Current: ${vault.awardAvailable??600} points · Deduct: ${(vault.awardAvailable??600)-nextAward} · Remaining: ${nextAward}`,`الحالي: ${vault.awardAvailable??600} نقطة · الخصم: ${(vault.awardAvailable??600)-nextAward} · المتبقي: ${nextAward}`)}</p>
     <div><button disabled={blocked} onClick={()=>{const level=confirmLevel;setConfirmLevel(null);act({action:'vault-hint',level});}}>{copy('Use Hint','استخدام التلميح')}</button><button disabled={blocked} onClick={()=>setConfirmLevel(null)}>{copy('Cancel','إلغاء')}</button></div>
    </div>}
   </div>}
  </div>}
  {keypad&&!vault.unlockedAt&&<div className="vault-keypad-wrap"><div className="vault-keypad" dir="ltr" role="group" aria-label={copy('Code keypad','لوحة إدخال الرمز')}>{['1','2','3','4','5','6','7','8','9'].map(n=><button key={n} disabled={blocked||code.length===4} onClick={()=>enter(n)}>{n}</button>)}<button disabled={blocked||!code} onClick={()=>setCode('')}>{copy('Clear','مسح')}</button><button disabled={blocked||code.length===4} onClick={()=>enter('0')}>0</button><button disabled={blocked||!code} aria-label={copy('Delete last digit','حذف آخر رقم')} onClick={()=>setCode(c=>c.slice(0,-1))}>⌫</button></div><button className="vault-keypad-close" onClick={()=>setKeypad(false)}>{copy('Hide keypad','إخفاء اللوحة')}</button></div>}
  {vault.unlockedAt&&<div className="vault-discovery-overlay"><div className="vault-discovery" role="dialog" aria-modal="true" aria-label={copy('Recovered archive document','مستند الأرشيف المستعاد')} aria-live="polite">
    {opening?<p>{copy('Opening the archive…','جارٍ فتح الأرشيف…')}</p>:<>
     {vault.revealedCode&&<p>{copy('Revealed combination','الرمز الذي تم إظهاره')}: <bdi>{vault.revealedCode}</bdi></p>}
     <article className="vault-paper"><p>{copy('RECOVERED · DELETED CONVERSATION','مستعادة · محادثة محذوفة')}</p><h2>{display(vault.discovery?.title)}</h2><time>{vault.discovery?.timestamp&&new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(vault.discovery.timestamp))}</time>{vault.discovery?.conversation?.[language]?.map((message,index)=><p className="vault-message" key={index} dir="auto">{message}</p>)||<div>{display(vault.discovery?.description)}</div>}</article>
     <button className="vault-primary" disabled={blocked} onClick={()=>act({action:'vault-continue'})}>{copy('REVIEW THE INVESTIGATION BOARD →','راجع لوحة التحقيق ←')}</button>
    </>}
  </div></div>}
  <dialog className="vault-reference-dialog" dir={ar?'rtl':'ltr'} ref={dialog} aria-labelledby="vault-reference-title" onCancel={event=>{event.preventDefault();setSource(null);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setSource(null);}}} onClick={event=>{if(event.target===event.currentTarget)setSource(null);}}>
   <button className="vault-close" aria-label={copy('Close document','إغلاق المستند')} onClick={()=>setSource(null)}>×</button>
   {selected&&<article><p>{copy('ORIGINAL CORRESPONDENCE','المراسلات الأصلية')}</p><h2 id="vault-reference-title" dir="auto">{display(selected.title)}</h2>{selected.from&&<p>{display(selected.senderName)} · <bdi>{selected.from}</bdi></p>}<time>{new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(selected.timestamp))}</time><div className="vault-reference-body" dir="auto">{display(selected.description)}</div></article>}
  </dialog>
 </section>;
}
