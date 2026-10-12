import {requestJson} from './http.js';
// Mutations may be retried: the server applies each revision once and answers a replay with 409
// carrying the already-committed mission, which the caller adopts instead of re-applying.
export async function independentRequest(action,body={},missionOverride){
 const mission=missionOverride||JSON.parse(localStorage.getItem('cyberMission.independentMission')||'null');
 if(!mission?.startedAt)throw new Error('Mission has not started');
 const key=`cyberMission.access.${mission.missionId}`;
 let accessToken=localStorage.getItem(key);
 if(!accessToken){accessToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem(key,accessToken);}
 const revisionKey=`cyberMission.independentRevision.${mission.missionId}`;
 const data=await requestJson(`/api/booth/independent/${mission.missionId}/${mission.currentStation}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:Number(localStorage.getItem(revisionKey)||0),...body,missionId:mission.missionId,accessToken})},action==='poll'?{timeoutMs:6000,retries:0}:{timeoutMs:10000,retries:2,deadlineMs:32000});
 if(Number.isInteger(data.revision))localStorage.setItem(revisionKey,String(data.revision));
 return data;
}
