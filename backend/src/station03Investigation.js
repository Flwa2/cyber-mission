import {recordDataDecision} from './station03Sharing.js';
import { buildInvestigation } from '../../shared/station03Content.mjs';
import { DATA_CLASSIFICATIONS } from '../../shared/dataClassification.mjs';

export function recordInvestigation(mission, action, itemId, now, catalog=buildInvestigation(mission), selectedClassification, policy) {
  if(!['inspect','add','remove','begin-classification','answer','classify','share','complete'].includes(action))throw new Error('Unknown investigation action');
  if(policy?.dataChallenge?.version===2&&['classify','share'].includes(action))throw new Error('Use the connected scenario questions');
  const challengeAction=policy?.dataChallenge&&['answer','complete'].includes(action);
  const record=catalog.find(item=>item.id===itemId);
  if(!['complete','begin-classification'].includes(action)&&!record&&!challengeAction)throw new Error('Unknown investigation item');
  const previous=mission.decisions.station03;
  const station=structuredClone(previous||{startedAt:now,inspectedIds:[],selectedIds:[],completedAt:null});
  if(station.completedAt)throw new Error('Investigation already completed');
  if(policy){
    const required=policy.requiredDocumentIds;
    if(['inspect','add','remove'].includes(action)&&station.phase==='classification')throw new Error('Evidence collection is finished');
    if(action==='begin-classification'){
      station.phase='classification';station.investigationCompletedAt ||= now;
    }
    if(challengeAction)recordDataDecision(station,policy.dataChallenge,action,itemId,selectedClassification,now,mission.missionId);
    if(action==='share'&&!policy.dataChallenge)throw new Error('Sharing phase is unavailable');
    if(action==='classify'&&!policy.dataChallenge){
      if(station.phase!=='classification')throw new Error('Finish the investigation first');
      const next=required.find(id=>!station.classifications?.[id]?.confirmedAt);
      if(itemId!==next)throw new Error('Classify the next document');
      if(!DATA_CLASSIFICATIONS.some(level=>level.id===selectedClassification))throw new Error('Choose a data classification');
      station.classifications={...station.classifications,[itemId]:{missionId:mission.missionId,evidenceId:itemId,selectedClassification,expectedClassification:record.expectedClassification,classificationDecisionAt:now,confirmedAt:now}};
    }
    if(action==='complete'&&!policy.dataChallenge&&(station.phase!=='classification'||required.some(id=>!station.classifications?.[id]?.confirmedAt)))throw new Error('Confirm both document classifications first');
  }else if(['begin-classification','classify','share'].includes(action))throw new Error('Classification phase is unavailable');
  if(action==='add'&&!station.inspectedIds.includes(itemId))throw new Error('Inspect the item before collecting it');
  if(action==='add'&&record.evidenceEligible===false)throw new Error('This item is not eligible for the Evidence File');
  // Collection and classification are one atomic transaction. Never accept an expected answer from the client.
  if(!policy&&action==='add'&&record.expectedClassification){
    if(!DATA_CLASSIFICATIONS.some(level=>level.id===selectedClassification))throw new Error('Choose a data classification');
    station.classifications={...station.classifications,[itemId]:{evidenceId:itemId,selectedClassification,expectedClassification:record.expectedClassification,classificationDecisionAt:now}};
  }
  if(action==='inspect'&&!station.inspectedIds.includes(itemId))station.inspectedIds.push(itemId);
  if(action==='add'&&!station.selectedIds.includes(itemId))station.selectedIds.push(itemId);
  if(action==='remove')station.selectedIds=station.selectedIds.filter(id=>id!==itemId);
  if(action==='complete')station.completedAt=now;
  mission.decisions.station03=station;
  const selected=catalog.filter(item=>station.selectedIds.includes(item.id)).map(item=>({
    id:item.id,station:3,source:item.source,type:item.type,timestamp:item.timestamp,
    relatedDecision:item.relatedDecision,isIncidentRelevant:item.isIncidentRelevant,
    metadata:item.metadata,title:item.title,description:item.description,
    ...(station.classifications?.[item.id]?{classification:{...station.classifications[item.id]}}:{})
  }));
  if(Array.isArray(mission.evidence))mission.evidence=[...mission.evidence.filter(item=>item.station!==3),...selected];
  else mission.evidence={...mission.evidence,station03:selected};
  mission.updatedAt=now;
}
