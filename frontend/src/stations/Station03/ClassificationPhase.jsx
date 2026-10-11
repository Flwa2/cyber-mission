import {useEffect,useRef,useState} from 'react';
import {useTranslation} from '../../locales/LanguageProvider.jsx';

// A normal desktop window; all answers and completion still use the existing actions.
export default function ClassificationPhase({mission,onAction,busy,error,win,zIndex,onFocus,onClose,onMinimize}){
 const {t,language}=useTranslation(),ar=language==='ar';
 const challenge=mission.station03Experience?.dataChallenge;
 const questions=challenge?.questions||[],answers=mission.decisions.station03?.dataDecisions?.answers||{};
 const question=questions.find(row=>!answers[row.id]?.confirmedAt);
 const completionStarted=useRef(false),[completionFailed,setCompletionFailed]=useState(false);
 const [selected,setSelected]=useState({questionId:null,optionId:null});
 const selection=selected.questionId===question?.id?selected.optionId:null;
 useEffect(()=>{
 if(!questions.length||question||busy||completionStarted.current||completionFailed)return;
 completionStarted.current=true;
 Promise.resolve(onAction('complete')).then(ok=>{if(!ok)setCompletionFailed(true);}).catch(()=>setCompletionFailed(true));
 },[question,busy,completionFailed,onAction,questions.length]);
 const currentQuestionIndex=question?questions.indexOf(question)+1:questions.length;
 const promptText=question?.prompt?.[language]||question?.prompt?.en||'';
 const context=question?.context;
 const contextTitle=context?.subject?.[language]||context?.subject?.en||'';
 const receivedAt=context?.receivedAt?new Date(context.receivedAt).toLocaleString(ar?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'';
 return <section hidden={!win||win.minimized} className="classification-phase" data-app="financial" style={{position:'absolute',inset:0,zIndex}} dir={ar?'rtl':'ltr'} onPointerDown={onFocus} onFocusCapture={onFocus} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}} aria-label={t('Data Classification')}>
 <header className="classification-phase-header">
  <div className="classification-header-copy">
   <span>{ar?`المحطة 03 • ${t('Phase 2 of 2')}`:`Station 03 • ${t('Phase 2 of 2')}`}</span>
   <h1>{t('Data Classification')}</h1>
   <p>{t('Read the message and choose the appropriate response.')}</p>
  </div>
  <span>{question ? <>{ar?'السؤال':'Question'} <bdi>{currentQuestionIndex} / {questions.length}</bdi></> : <bdi>{questions.length} / {questions.length}</bdi>}</span>
 </header>
 {!question ? <div className="classification-panel classification-transferring" role="status">
  <p>{ar?'جارٍ تسجيل القرارات والانتقال إلى المحطة التالية…':'Recording decisions and preparing the next station…'}</p>
  {completionFailed&&<button className="classification-confirm" onClick={()=>{completionStarted.current=false;setCompletionFailed(false);}}>{t('Retry')}</button>}
 </div> : <div className="classification-workspace">
  {context&&<article className="classification-context-card" aria-label={t('Message')}>
   <header><span className="classification-context-avatar" aria-hidden="true">{(context.sender?.[language]||context.sender?.en||'').slice(0,1)}</span>
    <div className="classification-context-sender"><strong dir="auto">{context.sender?.[language]||context.sender?.en}</strong><span><bdi>{context.from}</bdi></span></div>
    {receivedAt&&<time dateTime={context.receivedAt}><bdi>{receivedAt}</bdi></time>}
   </header>
   <h2 dir="auto">{contextTitle}</h2>
   <p dir="auto">{context.body?.[language]||context.body?.en||''}</p>
  </article>}
  <aside className="classification-panel">
   <div className="classification-status">
    <strong><bdi>{currentQuestionIndex} / {questions.length}</bdi></strong>
    <span>{t('Question')}</span>
   </div>
   <h2>{promptText}</h2>
   <p className="classification-preview-note">{t('Choose one response to continue.')}</p>
   <div className={`classification-levels ${question.id==='q1-public-classification'?'classification-levels-q1':'classification-levels-procedure'}`} role="group" aria-label={promptText}>
    {question.options.map(option=><button key={option.id} type="button" disabled={busy} className="classification-level" aria-pressed={selection===option.id} onClick={()=>setSelected({questionId:question.id,optionId:option.id})}>
     <i aria-hidden="true" />
     <span className="classification-option-copy">{option.label[language]||option.label.en}</span>
     <span className="classification-radio" aria-hidden="true" />
    </button>)}
   </div>
   <button type="button" className="classification-confirm" disabled={!selection||busy} onClick={()=>onAction('answer',question.id,selection)}>{ar?'تأكيد الإجابة':'Confirm response'}</button>
   {error&&<p className="classification-error" role="alert">{t(error)}</p>}
  </aside>
 </div>}
 </section>;
}
