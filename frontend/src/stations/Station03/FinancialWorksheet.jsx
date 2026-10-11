import {useTranslation} from '../../locales/LanguageProvider.jsx';
export default function FinancialWorksheet({document}){
 const {language}=useTranslation();
 const rows=(document.description[language]||document.description.en).split('\n').map(row=>row.split(' | '));
 return <div className="financial-worksheet" dir={language==='ar'?'rtl':'ltr'}>
  <div className="worksheet-formula"><bdi>A1</bdi><span aria-hidden="true">fx</span><span>{rows[0][0]}</span></div>
  <h2>{language==='ar'?'ملخص البيانات المالية للصندوق':'Fund Financial Data Summary'}</h2>
  <table><thead><tr><th aria-hidden="true"/>{rows[0].map((_,i)=><th key={i} scope="col">{String.fromCharCode(65+i)}</th>)}</tr></thead>
   <tbody>{rows.map((row,i)=><tr key={i}><th scope="row">{i+1}</th>{row.map((cell,j)=>i===0?<th key={j} scope="col">{cell}</th>:<td key={j}>{j?<bdi>{cell}</bdi>:cell}</td>)}</tr>)}</tbody>
  </table>
  <p>{document.fictionalNote[language]}</p>
  <footer>{language==='ar'?'الملخص المالي':'Financial summary'}</footer>
 </div>;
}
