import {useEffect,useRef,useState} from 'react';
import {useTranslation} from '../../locales/LanguageProvider.jsx';
import MissionTopBar from '../../components/MissionTopBar/MissionTopBar.jsx';
import MissionIcon from '../../components/MissionIcon/MissionIcon.jsx';
import {narrativeAvatarPath} from '../../../../shared/narrativeCharacters.mjs';
import {FIRST_RESPONSES,EVIDENCE_RESPONSES} from '../../../../shared/station04Content.mjs';
import {station04Evidence} from './evidence.mjs';
import './Station04.css';
import Vault from './Vault.jsx';

function ResponseIcon({name}){
 const paths={security:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6',search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',people:'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M19 15a5 5 0 0 1 3 5v1'};
 return paths[name]?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>:<MissionIcon name={name}/>;
}

export default function Station04({mission,onAction,busy=false,error='',onExit}){
 const {language,t}=useTranslation(),arabic=language==='ar';
 const copy=(en,ar)=>arabic?ar:en,display=value=>value?.[language]||value?.en||value||'';
 const state=mission.decisions?.station04;
 const people=mission.narrativeAssignment?.choices||[];
 const phase=state?.completedAt?'completed':[2,3].includes(state?.version)?state.phase:'intro';
 const step=['person','response','evidence'].indexOf(phase)+1;
 const heading=useRef(null);
 const previewDialog=useRef(null);
 const [preview,setPreview]=useState(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[phase]);
 useEffect(()=>{
  const dialog=previewDialog.current;
  if(!dialog)return;
  if(preview&&!dialog.open)dialog.showModal();
  else if(!preview&&dialog.open)dialog.close();
 },[preview]);
 const selected=state?.[{person:'associatedPersonSelection',response:'firstResponseSelection',evidence:'evidenceHandlingSelection'}[phase]];
 const act=payload=>onAction?.(payload);
 const select=selection=>act({action:'select-response',phase,selection});
 const boardClues=station04Evidence(mission,language);
 const title=phase==='person'?copy('REVIEW THE CONNECTIONS','راجع الروابط'):phase==='response'?copy('NEXT ACTION','الخطوة التالية'):copy('INCIDENT INFORMATION','معلومات الحادث');
 const question=phase==='person'?copy('Whose account is linked to the unusual activity in the records you reviewed?','حساب أي موظف يرتبط بالنشاط غير المعتاد في السجلات التي راجعتها؟'):phase==='response'?copy('Based on what you found, what would you do first?','بناءً على ما توصلت إليه، ما أول إجراء ستتخذه؟'):copy('What would you do with the files, messages and records related to this incident?','كيف ستتعامل مع الملفات والرسائل والسجلات المرتبطة بهذا الحادث؟');
 if(mission.vault&&!mission.vault.discoveryAcknowledgedAt)return <main className="response-scene is-vault" dir={arabic?'rtl':'ltr'}><MissionTopBar currentStation={4} mission={mission} onExit={onExit}/><Vault vault={mission.vault} onAction={onAction} busy={busy} error={error}/></main>;
 return <main className={`response-scene ${phase==='completed'?'is-complete':''} ${phase==='person'?'is-investigation-board':''}`} dir={arabic?'rtl':'ltr'}>
  <MissionTopBar currentStation={4} mission={mission} onExit={onExit} hideIncident={phase==='completed'}/>
  {phase==='person'?<section className="investigation-board" aria-labelledby="investigation-title">
   <header className="investigation-board-heading">
    <div><p>{copy('STATION 04 · REVIEW','المحطة 04 · مراجعة الوقائع')}</p><h1 id="investigation-title" ref={heading} tabIndex={-1}>{question}</h1><span className="investigation-subtitle">{copy('Choose the account supported by your evidence','اختر الحساب الذي تدعمه أدلتك')}</span></div>
    <button className="investigation-evidence-review" onClick={()=>setPreview({kind:'evidence-list'})}><MissionIcon name="file"/><span>{copy('Review Evidence','مراجعة الأدلة')}</span></button>
   </header>
   <div className="investigation-columns">
    <section className="investigation-panel investigation-canvas" aria-label={copy('Investigation board','لوحة التحقيق')}>
     <div className="investigation-pins">
      <svg className="investigation-threads" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
       <path className="thread-cyan" d="M80 118 C205 38 285 112 405 190 S632 302 800 118"/>
       <path className="thread-red" d="M155 472 C278 382 315 260 488 295 S705 463 865 464"/>
       <path className="thread-cyan thread-faint" d="M176 145 C220 314 334 437 493 292 S715 151 829 164"/>
       <path className="thread-red thread-faint" d="M120 214 C309 252 398 139 576 181 S742 396 894 360"/>
       <circle cx="500" cy="300" r="4"/><circle cx="500" cy="300" r="12"/>
      </svg>
      <div className="investigation-portraits">{people.map((person,index)=><article className={`investigation-photo-card photo-slot-${index+1}${selected===person.id?' is-selected':''}`} key={person.id} data-person-id={person.id} role="button" tabIndex={busy?-1:0} aria-pressed={selected===person.id} onClick={()=>!busy&&select(person.id)} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&!busy){event.preventDefault();select(person.id);}}}>
       <span className="investigation-photo-pin" aria-hidden="true"/>
       <div className="investigation-photo-open">
        <img className="narrative-portrait" src={narrativeAvatarPath(person.avatarId)} alt=""/>
        <button className="investigation-photo-zoom" onClick={event=>{event.stopPropagation();setPreview({kind:'employee',item:person});}} aria-label={`${copy('View profile','عرض الملف')}: ${display(person.name)}`}>⌕</button>
       </div>
       <div className="investigation-photo-caption"><strong>{display(person.name)}</strong><span>{display(person.role)}</span></div>
      </article>)}</div>
     </div>
     <footer className="investigation-canvas-footer"><button className="response-primary investigation-confirm" disabled={busy||!selected||!onAction} onClick={()=>act({action:'advance-response'})}>{copy('Confirm Suspect','تأكيد المشتبه به')}<span aria-hidden="true">{arabic?'←':'→'}</span></button></footer>
    </section>
   </div>
   {error&&<p className="response-error investigation-error" role="alert">{t(error)}</p>}
   <dialog ref={previewDialog} className="investigation-preview-dialog" aria-labelledby="investigation-preview-title" onCancel={event=>{event.preventDefault();setPreview(null);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setPreview(null);}}} onClick={event=>{if(event.target===event.currentTarget)setPreview(null);}}>
    {preview&&<div className="investigation-preview-content">
     <button className="investigation-dialog-close" autoFocus onClick={()=>setPreview(null)} aria-label={copy('Close preview','إغلاق المعاينة')}>×</button>
     {preview.kind==='evidence-list'?<div className="investigation-evidence-list"><p>{copy('COLLECTED EVIDENCE','الأدلة المجموعة')}</p><h2 id="investigation-preview-title">{copy('Review the records from previous stations','راجع السجلات من المحطات السابقة')}</h2>{boardClues.length?<div>{boardClues.map(item=><button key={item.id} onClick={()=>setPreview({kind:'evidence',item})}><strong>{display(item.title)}</strong><span>{display(item.description||item.action)}</span></button>)}</div>:<p>{copy('No evidence was recorded from the previous stations.','لم يتم تسجيل أي أدلة من المحطات السابقة.')}</p>}</div>:preview.kind==='employee'?<div className="investigation-profile-preview"><img className="narrative-portrait" src={narrativeAvatarPath(preview.item.avatarId)} alt=""/><p>{copy('EMPLOYEE PROFILE','ملف الموظف')}</p><h2 id="investigation-preview-title">{display(preview.item.name)}</h2><span>{display(preview.item.role)}</span></div>:<div className="investigation-evidence-preview">
      <p>{preview.item.station===2?copy('STATION 02 · DESK ITEM','المحطة 02 · عنصر المكتب'):copy('STATION 03 · SELECTED ITEM','المحطة 03 · عنصر محدد')}</p><h2 id="investigation-preview-title">{display(preview.item.title)}</h2>
      {preview.item.station===2?<dl>{preview.item.details.map(([label,value],index)=><div key={`${index}-${display(label)}`}><dt>{display(label)}</dt><dd>{display(value)}</dd></div>)}<div><dt>{copy('Recorded choice','الإجراء المسجل')}</dt><dd>{display(preview.item.action)}</dd></div></dl>:<><div className="investigation-evidence-meta"><span>{display(preview.item.metadata?.senderName)||display(preview.item.metadata?.from)||copy('Saved item','عنصر محفوظ')}</span>{preview.item.timestamp&&<time dateTime={preview.item.timestamp}>{new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(preview.item.timestamp))}</time>}</div><p className="investigation-evidence-description">{display(preview.item.description)}</p></>}
     </div>}
     <button className="investigation-dialog-done" onClick={()=>setPreview(null)}>{copy('CLOSE PREVIEW','إغلاق المعاينة')}</button>
    </div>}
   </dialog>
  </section>:<div className="response-stage">
   <section key={phase} className={`response-content response-${phase}`} aria-labelledby="response-title">
   <div className="response-location"><span>{copy('STATION 04','المحطة 04')}</span></div>
   {phase==='intro'?<>
    <p className="response-kicker">{copy('FINAL RESPONSE','الاستجابة النهائية')}</p>
    <h1 id="response-title" ref={heading} tabIndex={-1}>{copy('STOP THE INCIDENT','أوقف الحادث')}</h1>
    {arabic&&<p className="response-english" lang="en">STOP THE INCIDENT</p>}
    <p className="response-lead">{copy('Unusual activity has been detected and is connected to evidence you encountered during your previous missions.','تم رصد نشاط غير معتاد مرتبط بالأدلة التي ظهرت خلال مهامك السابقة.')}</p>
    <p className="response-description">{copy('Use the information you gathered to identify the person associated with the activity, then respond appropriately to the incident.','استخدم ما جمعته من معلومات لتحديد الشخص المرتبط بالنشاط، ثم اتخذ الاستجابة المناسبة للحادث.')}</p>
    <button className="response-primary" disabled={busy||!onAction} onClick={()=>act({action:'begin-response'})}>{copy('BEGIN RESPONSE','ابدأ الاستجابة')}<span aria-hidden="true">{arabic?'←':'→'}</span></button>
   </>:phase==='completed'?<>
    <span className="response-completion-mark" aria-hidden="true">✓</span>
    <h1 id="response-title" ref={heading} tabIndex={-1}>{copy('MISSION COMPLETE','تم إكمال المهمة')}</h1>
    <p className="response-lead" role="status">{copy('Your response has been submitted successfully.','تم تسجيل استجابتك بنجاح.')}</p>
    {mission.station04Result&&<section className="response-verdict" aria-label={copy('Investigation result','نتيجة التحقيق')}>
     <h2>{mission.station04Result.correct?copy('Your choice was correct','اختيارك صحيح'):copy('Your choice was incorrect','اختيارك غير صحيح')}</h2>
     <p>{copy('Correct suspect','المشتبه به الصحيح')}: <strong>{display(mission.station04Result.correctPerson.name)}</strong></p>
     <p>{copy('Your choice','اختيارك')}: <strong>{display(mission.station04Result.selectedPerson.name)}</strong></p>
     <p>{display(mission.station04Result.explanation)}</p>
     <small>{copy('The records identify the account involved; they do not establish malicious intent.','تحدد السجلات الحساب المرتبط بالنشاط، ولا تثبت وجود نية ضارة.')}</small>
    </section>}
    {mission.finalScore&&<><h2><bdi dir="ltr">{mission.finalScore.total.toLocaleString(language)} / 5,000</bdi></h2><div className="response-options">{Object.values(mission.finalScore.stations).map((score,index)=><div className="response-option" key={index}><span>{copy(`Station 0${index+1}`,`المحطة 0${index+1}`)}</span><strong><bdi dir="ltr">{score.earned} / {score.maximum}</bdi></strong></div>)}</div><button className="response-primary" onClick={onExit}>{copy('BACK TO HOME','العودة للرئيسية')}</button></>}
   </>:<>
    <p className="response-kicker">{copy(`STEP ${step} OF 3`,`الخطوة ${step} من 3`)}</p>
    <h1 id="response-title" ref={heading} tabIndex={-1}>{title}</h1>
    {phase==='response'&&<p className="response-description">{copy('A cybersecurity incident has been confirmed.','تم تأكيد وجود حادث سيبراني.')}</p>}
    <h2>{question}</h2>
    <p className="response-help">{phase==='person'?copy('Use the evidence you encountered during the previous missions.','اعتمد على الأدلة التي ظهرت في المهام السابقة.'):copy('Choose one action.','اختر إجراءً واحدًا.')}</p>
    <div className={phase==='person'?'response-people':'response-options'} role="group" aria-label={question}>
     {phase==='person'?people.map(person=><button className="response-option response-person-card" key={person.id} data-person-id={person.id} disabled={busy} aria-pressed={selected===person.id} onClick={()=>select(person.id)}><img className="narrative-portrait" src={narrativeAvatarPath(person.avatarId)} alt=""/><strong>{display(person.name)}</strong><span>{display(person.role)}</span><span className="response-selection" aria-hidden="true">{selected===person.id?'✓':''}</span></button>):(phase==='response'?FIRST_RESPONSES:EVIDENCE_RESPONSES).map(option=><button className="response-option" key={option.id} disabled={busy} aria-pressed={selected===option.id} onClick={()=>select(option.id)}><ResponseIcon name={option.icon}/><span>{display(option.label)}</span><span className="response-selection" aria-hidden="true">{selected===option.id?'✓':''}</span></button>)}
    </div>
    <footer className="response-navigation"><button className="response-primary" disabled={busy||!selected||!onAction} onClick={()=>act({action:phase==='evidence'?'submit-response':'advance-response'})}>{phase==='evidence'?copy('SUBMIT RESPONSE','إرسال الاستجابة'):copy('NEXT','التالي')}<span aria-hidden="true">{arabic?'←':'→'}</span></button><span className="response-save" role="status">{busy?copy('Saving response…','جارٍ حفظ الاستجابة…'):selected?copy('Selection recorded','تم تسجيل الاختيار'):''}</span></footer>
   </>}
   {error&&<p className="response-error" role="alert">{t(error)}</p>}
   </section>
  </div>}
 </main>;
}
