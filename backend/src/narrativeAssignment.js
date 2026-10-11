import {randomInt} from 'node:crypto';
import {createNarrativeAssignment,narrativeClue} from '../../shared/narrativeAssignment.mjs';
import {refineIncidentStory} from './station03Narrative.js';

export function ensureNarrativeAssignment(record,{legacy=true,random=randomInt}={}){
 if(record.mission.narrativeAssignment)return record.mission.narrativeAssignment;
 record.mission.narrativeAssignment=createNarrativeAssignment(random,new Date().toISOString(),{legacy});
 return record.mission.narrativeAssignment;
}

export function bindNarrativeClue(record){
 const assignment=ensureNarrativeAssignment(record),experience=record.station03Experience;
 if(!experience||experience.narrativeBoundAt===assignment.assignedAt||record.mission.decisions.station03?.completedAt)return;
 // Existing bound snapshots remain exactly as encountered. New stories retain
 // every evidence ID and private answer, but bind all display identities together.
 if(record.caseAssignment?.definition&&!record.mission.decisions.station03?.inspectedIds?.length){
  refineIncidentStory(record);
  experience.narrativeBoundAt=assignment.assignedAt;
  return;
 }
 // Keep the existing evidence ID, relevance, timestamps, classification and sharing assignments.
 const row=experience.rows.find(r=>r.source==='mail'&&r.metadata.from==='sara@example.com');
 if(!row)return;
 const clue=narrativeClue(assignment);
 Object.assign(row,{title:clue.title,description:clue.description,metadata:{...row.metadata,...clue.metadata}});
 experience.narrativeBoundAt=assignment.assignedAt;
 const update=item=>item.id===row.id?{...item,title:row.title,description:row.description,metadata:structuredClone(row.metadata)}:item;
 if(Array.isArray(record.mission.evidence))record.mission.evidence=record.mission.evidence.map(update);
 else if(record.mission.evidence?.station03)record.mission.evidence.station03=record.mission.evidence.station03.map(update);
}
