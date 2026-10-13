import {useTranslation} from '../../locales/LanguageProvider.jsx';
import BidiText from '../../components/BidiText.jsx';

// Shared reading surface; only participant-visible record fields are rendered.
export default function CorporateDocument({document}) {
 const {t,language}=useTranslation();
 const display=value=>typeof value==='object'?value[language]||value.en:value;
 const lines=display(document.description).split('\n').filter(Boolean);
 const isField=line=>/^[^:]{1,65}:\s/.test(line);
 const fields=lines.filter(isField);
 const directory=lines.filter(line=>line.split(' / ').length===4).map(line=>line.split(' / '));
 const tableRows=lines.filter(line=>line.includes(' | ')).map(line=>line.split(' | '));
 const reference=document.metadata.reference;
 const paragraphs=lines.filter(line=>!isField(line)&&!line.includes(' | ')&&line.split(' / ').length!==4&&!(reference&&line.startsWith(`${reference} —`)));
 const titles={'case:directory':'Employee contacts','case:cover':'Project update','case:export':'Supplier Payment Summary','case:handover':'Project Handover Record'};
 return <div className={`document-sheet corporate-document ${directory.length?'has-directory':''}`} dir={language==='ar'?'rtl':'ltr'}>
  <div className="corporate-document-brand">{t('Environment Fund')}</div>
  <h2 dir="auto">{titles[document.id]?t(titles[document.id]):display(document.title).replace(/_/g,' ').replace(/\.(pdf|xlsx|docx)$/i,'')}</h2>
  <div className="document-reference">{reference&&<span>{t('Reference')}: <bdi>{reference}</bdi></span>}<time dir="ltr">{new Date(document.timestamp).toLocaleDateString('en-GB')}</time></div>
  <section className="document-content">{paragraphs.map((line,i)=><p key={i} dir="auto"><BidiText text={line} language={language}/></p>)}
   {fields.length>0&&<table><tbody>{fields.map((line,i)=>{const split=line.indexOf(':');return <tr key={i}><th>{line.slice(0,split)}</th><td dir="auto"><BidiText text={line.slice(split+1).trim()} language={language}/></td></tr>;})}</tbody></table>}
   {directory.length>0&&<table className="directory-table"><thead><tr>{['Employee','Department','Workstation','Email address'].map(label=><th key={label}>{t(label)}</th>)}</tr></thead><tbody>{directory.map((cells,i)=><tr key={i}>{cells.map((cell,j)=><td key={j}>{j>=2?<bdi>{cell}</bdi>:cell}</td>)}</tr>)}</tbody></table>}
   {tableRows.length>1&&<table className="business-table"><thead><tr>{tableRows[0].map((cell,i)=><th key={i}>{cell}</th>)}</tr></thead><tbody>{tableRows.slice(1).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} dir="auto"><BidiText text={cell} language={language}/></td>)}</tr>)}</tbody></table>}
   {Object.entries(document.metadata).filter(([key])=>!['reference','senderName','access'].includes(key)).length>0&&<dl className="document-metadata">{Object.entries(document.metadata).filter(([key])=>!['reference','senderName','access'].includes(key)).map(([key,value])=><div key={key}><dt>{t(`investigation.meta.${key}`)}</dt><dd dir="auto">{display(value)}</dd></div>)}</dl>}
  </section>
  {document.fictionalNote&&<p className="corporate-fictional-note">{display(document.fictionalNote)}</p>}
  <footer><span>{t('Environment Fund')}</span><span>1 / 1</span></footer>
 </div>;
}
