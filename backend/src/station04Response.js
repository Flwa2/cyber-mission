import {scoreResponse} from './progressiveScoring.js';
import {FIRST_RESPONSES,EVIDENCE_RESPONSES} from '../../shared/station04Content.mjs';
import {createNarrativeAssignment} from '../../shared/narrativeAssignment.mjs';
import {vaultEnabled} from './station04VaultFlow.js';

const steps={
 person:{field:'associatedPersonSelection',next:'response'},
 response:{field:'firstResponseSelection',options:FIRST_RESPONSES,next:'evidence',answer:'notify_cybersecurity'},
 evidence:{field:'evidenceHandlingSelection',options:EVIDENCE_RESPONSES,answer:'preserve_and_follow_instructions'}
};

// Uses the existing resolution transaction/lease/revision boundary. Never resets mission time.
export function recordIncidentResponse(record,body,now=new Date().toISOString()){
 if(vaultEnabled(record)&&!record.vaultState?.discoveryAcknowledgedAt)throw new Error('Review the recovered archive first');
 const mission=record.mission;
 const prior=mission.decisions.station04;
 if(prior?.completedAt)throw new Error('Response already submitted');
 // Legacy fixtures/direct calls get the established Sara story, never a reroll.
 const assignment=mission.narrativeAssignment ||= createNarrativeAssignment(()=>0,now,{legacy:true});
 // Preserve old in-progress case decisions as a historical snapshot, without interpreting them as new answers.
 const version=record.mode==='independent-v1'?3:2;
 const next=prior?.version===version?structuredClone(prior):{
  version,phase:'intro',associatedPersonSelection:null,firstResponseSelection:null,
  evidenceHandlingSelection:null,startedAt:now,completedAt:null,
  ...(prior?{legacyDecisions:structuredClone(prior)}:{})
 };
 const step=steps[next.phase];
 if(body.action==='begin-response'){
  if(next.phase!=='intro')throw new Error('Response has already begun');
  next.phase='person';
 }else if(body.action==='select-response'){
  if(!step||body.phase!==next.phase||!(next.phase==='person'?assignment.choices:step.options).some(option=>option.id===body.selection))throw new Error('Choose an available response');
  next[step.field]=body.selection;
 }else if(body.action==='advance-response'){
  if(!step?.next||!next[step.field])throw new Error('Choose a response before continuing');
  if(version===3){
   if(next.phase!=='person')throw new Error('Confirm the suspect first');
   next.phase='completed';next.completedAt=now;next.privateScore=scoreResponse(next,assignment,record.vaultState);
   mission.status='complete';mission.completedStations=[...new Set([...mission.completedStations,4])];record.phase='COMPLETED';
  }else next.phase=step.next;
 }else if(body.action==='submit-response'){
  if(next.phase!=='evidence'||Object.values(steps).some(s=>!next[s.field]))throw new Error('Complete the three responses first');
  next.phase='completed';next.completedAt=now;
  next.privateScore=scoreResponse(next,assignment);
  mission.status='complete';mission.completedStations=[...new Set([...mission.completedStations,4])];
  record.phase='COMPLETED';
 }else throw new Error('Unknown response action');
 mission.decisions.station04=next;mission.updatedAt=now;
}
