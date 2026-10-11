import {useTranslation} from '../../locales/LanguageProvider.jsx';
import {PEOPLE,CONTAINMENT} from '../../../../shared/casePeople.mjs';
import CyberMissionBrand from '../../components/CyberMissionBrand/CyberMissionBrand.jsx';
import FullscreenButton from '../../components/FullscreenButton/FullscreenButton.jsx';
import '../../stations/Station04/Station04.css';
export default function FinalResult({mission,onFinish,busy=false,resetting=false,error=''}){
 const {t,language}=useTranslation(),r=mission?.caseResult,display=value=>typeof value==='object'?value[language]||value.en:value;
 if(!r)return <main className="case-screen"><p>{t('The final result is not available for this earlier mission.')}</p></main>;
 const person=id=>display(PEOPLE.find(p=>p.id===id)?.name||t('Not selected'));
 const action=id=>display(CONTAINMENT.find(a=>a.id===id)?.label||id);
 const outcomes={contained:'Case contained',partial:'Containment in progress',review:'Further investigation needed'};
 const categories=[['station01','Message Analysis',200],['station02','Desk Security',250],['station03','Digital Investigation',300],['station04','Case Resolution',250]];
 function EvidenceGroup({label,rows}){return <section className="result-evidence-group"><h3>{t(label)} <span>{rows.length}</span></h3>{rows.length?<ul>{rows.map(row=><li key={row.id}>{display(row.title)}</li>)}</ul>:<p>{t('None')}</p>}</section>;}
 return <main className="case-screen result-screen">
  <header className="mission-topbar case-topbar"><CyberMissionBrand variant="compact"/><div className="mission-topbar-meta"><div className="topbar-data"><span>{t('Mission ID')}</span><strong>{mission.missionId}</strong></div><span>{t('Mission complete')}</span><FullscreenButton/></div></header>
  <div className="result-layout"><aside className="result-score"><span className="case-eyebrow">{t('Case review')}</span><h1>{t(outcomes[r.outcome])}</h1><div className="cyber-score"><span>{t('Cyber Score')}</span><strong>{r.total}</strong><small>/ 1000</small></div><div className="score-breakdown">{categories.map(([id,label,max])=><div key={id}><span>{t(label)}</span><strong>{r.breakdown[id]} / {max}</strong><progress max={max} value={r.breakdown[id]}/></div>)}</div>{error&&<p role="alert">{t(error)}</p>}<button className="case-primary" disabled={busy||resetting||!onFinish} onClick={onFinish}>{t(resetting?'Preparing station for the next participant...':'Finish mission')}</button></aside>
   <section className="result-reveal"><div className="result-person"><span className="case-avatar" aria-hidden="true">{person(r.personId).slice(0,1)}</span><div><span className="case-eyebrow">{t('The connected account')}</span><h2>{person(r.personId)} <bdi>{r.device}</bdi></h2><p>{t('Your selection')}: <strong>{person(r.selectedPerson)}</strong></p></div></div><p className="result-summary">{display(r.summary)}</p>
   <h3>{t('How the clues connect')}</h3><ol className="result-timeline">{r.timeline.map(row=><li key={row.id}><strong>{display(row.title)}</strong><time>{new Date(row.timestamp).toLocaleTimeString(language==='ar'?'ar-SA-u-nu-latn':'en-GB',{hour:'2-digit',minute:'2-digit'})}</time><p>{display(row.description)}</p></li>)}</ol>
   <div className="result-evidence"><EvidenceGroup label="Relevant items collected" rows={r.collected}/><EvidenceGroup label="Useful items missed" rows={r.missed}/><EvidenceGroup label="Unrelated items collected" rows={r.distractors}/></div>
   <div className="result-containment"><section><h3>{t('Your containment choices')}</h3><ul>{r.containment.map(id=><li key={id}>{action(id)}</li>)}</ul></section><section><h3>{t('Recommended response for this case')}</h3><ul>{r.expectedContainment.map(id=><li key={id}>{action(id)}</li>)}</ul></section></div>
   </section></div>
 </main>;
}
