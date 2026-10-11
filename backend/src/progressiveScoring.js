import {SMS_SCENARIOS as LEGACY_SMS_SCENARIOS} from '../../frontend/src/data/smsScenarios.js';
import {ACTIVE_SMS_SCENARIOS} from '../../frontend/src/data/activeSmsScenarios.js';

export const SCORE_VERSION = 'action-5000-v1';
export const MAXIMUMS = {station01:1000,station02:1000,station03:1500,station04:1500};
const clamp=(n,max)=>Math.max(0,Math.min(max,Math.round(n)));
export function scoreMessage(s={}) {
 const catalog=s.catalogVersion==='v2'?ACTIVE_SMS_SCENARIOS:LEGACY_SMS_SCENARIOS;
 const scenario=catalog.find(row=>row.id===s.scenarioId)||ACTIVE_SMS_SCENARIOS.find(row=>row.id===s.scenarioId);
 if(!scenario)return 0;
 const inspection=(s.senderInspected===true?100:0)+(s.messageDetailsViewed===true?100:0)+((scenario.link.exists?s.linkInspected===true:s.messageDetailsViewed===true)?100:0);
 const actions=scenario.classification==='phishing'?{report:700,block:350,delete:200,continue:100,openLink:0}:{continue:700,openLink:0,delete:100,block:150,report:100};
 const unsafe=scenario.classification==='phishing'&&(s.linkOpened===true||s.finalAction==='openLink');
 return clamp(inspection+(actions[s.finalAction]??0)-(unsafe?400:0),1000);
}
export function scoreDesk(items={}) {
 const allocations={usb:{report:200,leave:120,connect:-200},badge:{report:200,leave:40,use:-200},documents:{secure:200,report:200,leave:20,read:-150},cable:{report:150,leave:105,connect:-150},qr:{report:150,leave:105,scan:-150},power:{report:100,leave:70,use:-100}};
 return clamp(Object.entries(allocations).reduce((sum,[id,options])=>sum+(options[items[id]?.actionId]??0),0),1000);
}
export function scoreEvidence(rows=[],selectedIds=[]) {
 // Use the private, mission-specific catalog, not client evidence tags or legacy case IDs.
 const catalog=[...new Map(rows.filter(r=>r.id!=='challenge:financial-summary'&&r.id!=='financial-summary').map(r=>[r.id,r])).values()];
 const valid=catalog.filter(r=>r.isIncidentRelevant===true).sort((a,b)=>a.id.localeCompare(b.id));
 const selected=new Set(selectedIds);
 const allocations=Object.fromEntries(valid.map((r,i)=>[r.id,Math.floor(900/valid.length)+(i<900%valid.length?1:0)]));
 const earned=valid.reduce((sum,r)=>sum+(selected.has(r.id)?allocations[r.id]:0),0);
 const irrelevant=catalog.filter(r=>!r.isIncidentRelevant&&selected.has(r.id)).length;
 return {total:clamp(earned-irrelevant*60,900),maximum:900,allocations,earned,penalty:irrelevant*60};
}
export function scoreFinancial(challenge,answers={}) {
 const questions=(challenge?.questions||[]).map(q=>({questionId:q.id,points:answers[q.id]?.confirmedAt&&answers[q.id].selectedAnswer===q.expectedAnswer?200:0,maxPoints:200}));
 return {version:3,totalPoints:clamp(questions.reduce((sum,q)=>sum+q.points,0),600),maxPoints:600,questions};
}
export function scoreResponse(s,assignment,vault) {
 if(s.version===3){const breakdown={person:s.associatedPersonSelection===assignment?.associatedPersonId?900:0,vault:vault?.discoveryAcknowledgedAt?clamp(vault.awardAvailable??600,600):0};return {version:3,breakdown,total:clamp(breakdown.person+breakdown.vault,1500),maximum:1500};}

 const breakdown={person:s.associatedPersonSelection&&s.associatedPersonSelection===assignment?.associatedPersonId?500:0,
 response:({notify_cybersecurity:500,investigate_myself:200,delete_suspicious_content:-150,share_with_colleagues:-150})[s.firstResponseSelection]??0,
 evidence:({preserve_and_follow_instructions:500,change_settings_myself:100,delete_evidence:-150,share_incident_details:-150})[s.evidenceHandlingSelection]??0};
 return {version:2,breakdown,total:clamp(Object.values(breakdown).reduce((a,b)=>a+b,0),1500),maximum:1500};
}
// This private record is saved atomically with the existing completion transaction.
// Repeated finalization never recalculates an already finalized station.
export function finalizeStationScore(record,station) {
 const key=`station0${station}`,decision=record.mission.decisions?.[key];
 if(!decision?.completedAt||decision.timedOut||record.mission.status==='timed-out')return false;
 if(record.scoring?.stations[key])return false;
 // Resume an existing in-progress mission without losing earlier finalized decisions.
 // Only recorded completion/answer data is used; no history is fabricated.
 for(let prior=1;prior<station;prior++)finalizeStationScore(record,prior);
 let earned,components;
 if(station===1)earned=scoreMessage(decision);
 else if(station===2)earned=scoreDesk(decision.items);
 else if(station===3){
  if(!record.station03Experience?.dataChallenge)return false;
  const investigation=scoreEvidence(record.station03Experience.rows,decision.selectedIds);
  const financial=scoreFinancial(record.station03Experience.dataChallenge,decision.dataDecisions?.answers);
  earned=investigation.total+financial.totalPoints;components={investigation,financial};
 }else if(station===4){
  if(![2,3].includes(decision.version))return false; // Never add the obsolete timeline/containment score.
  const response=scoreResponse(decision,record.mission.narrativeAssignment,record.vaultState);
  earned=response.total;components={response};
 }else return false;
 record.scoring ||= {version:SCORE_VERSION,missionId:record.mission.missionId,maximum:5000,stations:{},total:0};
 record.scoring.stations[key]={earned,maximum:MAXIMUMS[key],finalizedAt:decision.completedAt,...(components?{components}:{})};
 record.scoring.total=Object.values(record.scoring.stations).reduce((sum,s)=>sum+s.earned,0);
 return true;
}
