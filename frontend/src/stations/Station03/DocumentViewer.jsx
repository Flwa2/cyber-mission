import FinancialWorksheet from "./FinancialWorksheet.jsx";
import {useEffect,useRef,useState} from 'react';
import {useTranslation} from '../../locales/LanguageProvider.jsx';
import {DesktopIcon} from './WorkstationWindow.jsx';
import CorporateDocument from './CorporateDocument.jsx';

export default function DocumentViewer({win,document,selected,busy,active,onAction,zIndex,onFocus,onClose,onMinimize,onMaximize,evidenceLocked=false,challengeDocument=false,onReview}) {
 const {t,language}=useTranslation();
 const windowRef=useRef(null);
 const [zoom,setZoom]=useState(100);
 const viewportRef=useRef(null),[pageWidth,setPageWidth]=useState(null);
 useEffect(()=>{
  const viewport=viewportRef.current;
  const resize=()=>{const style=getComputedStyle(viewport),width=viewport.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);if(width>0)setPageWidth(width);};
  const observer=new ResizeObserver(resize);observer.observe(viewport);resize();return()=>observer.disconnect();
 },[]);
 useEffect(()=>{if(!win.minimized)windowRef.current?.focus({preventScroll:true});},[win.minimized]);
 // Disabling the evidence button during a save can leave browser focus on body.
 // Restore only this active window, never another application or an exit dialog.
 useEffect(()=>{if(!busy&&active&&!win.minimized&&globalThis.document.activeElement===globalThis.document.body)windowRef.current?.focus({preventScroll:true});},[busy,active,win.minimized]);
 const title=typeof document.title==='object'?document.title[language]:document.title;
 const collected=selected.includes(document.id);
 return <section ref={windowRef} tabIndex={-1} hidden={win.minimized} className={`desktop-window document-viewer ${challengeDocument?'challenge-spreadsheet':''} ${win.maximized?'is-maximized':''}`} data-app="pdf" aria-label={t('Document Viewer')} style={{zIndex}} onPointerDown={onFocus} onFocusCapture={onFocus} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}}>
  <header className="desktop-titlebar"><DesktopIcon name="documents"/><strong dir="auto">{title}</strong><div><button aria-label={t('Minimize window')} onClick={onMinimize}>&minus;</button><button aria-label={t(win.maximized?'Restore window':'Maximize window')} onClick={onMaximize}>&#9633;</button><button aria-label={t('Close window')} onClick={onClose}>&times;</button></div></header>
  <div className="viewer-toolbar"><span className="viewer-page-count" aria-label={t('Page')}>{challengeDocument?(language==='ar'?'ورقة 1':'Sheet 1'):'1 / 1'}</span><div className="viewer-zoom" aria-label={t('Document zoom')}><button disabled={zoom===75} aria-label={t('Zoom out')} onClick={()=>setZoom(value=>Math.max(75,value-25))}>−</button><output aria-live="polite">{zoom}%</output><button disabled={zoom===150} aria-label={t('Zoom in')} onClick={()=>setZoom(value=>Math.min(150,value+25))}>+</button></div><span>{challengeDocument?(language==='ar'?'جدول بيانات':'Spreadsheet'):t('Document Viewer')}</span></div>
  <div ref={viewportRef} className="document-viewport"><div className="viewer-page" style={{width:pageWidth||'100%',zoom:zoom/100}}>{challengeDocument?<FinancialWorksheet document={document}/>:<CorporateDocument document={document}/>}</div></div>
  {challengeDocument?<div className="evidence-controls">{onReview&&<button className="evidence-toggle" onClick={onReview}>{language==='ar'?'راجعت المستند — متابعة':'Document reviewed — continue'}</button>}</div>:<div className="evidence-controls"><span role="status">{collected?t('Added to Evidence File'):''}</span><button className="evidence-toggle" disabled={busy||evidenceLocked} onClick={()=>onAction(collected?'remove':'add',document.id)}><DesktopIcon name="case"/>{t(collected?'Remove from Evidence Case':'Add to Evidence File')}</button></div>}
 </section>;
}
