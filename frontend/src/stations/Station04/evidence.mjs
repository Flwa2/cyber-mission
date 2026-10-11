import {DESK_OBJECTS} from '../../../../shared/deskObjects.mjs';
import {localizeDisplay} from '../../locales/translate.js';
import {workstationRecord} from '../Station03/workstationPresentation.js';

function evidenceEntries(evidence){
 return Array.isArray(evidence)?evidence:Object.values(evidence||{}).flatMap(value=>Array.isArray(value)?value:[]);
}

export function station04Evidence(mission,language='en'){
 const decisions=mission.decisions||{};
 const station02=decisions.station02?.items||{};
 const savedEvidence=evidenceEntries(mission.evidence);
 const deskEvidence=Object.entries(station02).flatMap(([objectId,decision])=>{
  const object=DESK_OBJECTS.find(item=>item.id===objectId);
  if(!object||!decision?.actionId)return [];
  const localized=localizeDisplay(object,language);
  const action=localized.actions.find(([id])=>id===decision.actionId)?.[1];
  return [{
   id:`desk:${objectId}`,
   station:2,
   source:'desk',
   type:'desk-item',
   title:localized.name,
   details:localizeDisplay(mission.caseFile?.physicalClues?.[objectId]||object.details,language),
   action,
   timestamp:decision.recordedAt
  }];
 });

 const station03Evidence=savedEvidence.filter(item=>item?.station===3);
 const selectedIds=Array.isArray(decisions.station03?.selectedIds)
  ?decisions.station03.selectedIds
  :station03Evidence.map(item=>item.id);
 const catalog=mission.station03Experience?.records||mission.caseFile?.records||[];
 const selectedEvidence=selectedIds.flatMap(id=>{
  const saved=station03Evidence.find(item=>item.id===id);
  const record=catalog.find(item=>item.id===id);
  if(!saved&&!record)return [];
  const {isIncidentRelevant,relatedDecision,expectedClassification,expectedRoleId,dataChallengeScore,...snapshot}={...record,...saved,id,station:3};
  return [workstationRecord(snapshot)];
 });
 return [...deskEvidence,...selectedEvidence];
}
