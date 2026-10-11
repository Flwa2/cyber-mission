export async function independentRequest(action,body={},missionOverride){
 const mission=missionOverride||JSON.parse(localStorage.getItem('cyberMission.independentMission')||'null');
 if(!mission?.startedAt)throw new Error('Mission has not started');
 const key=`cyberMission.access.${mission.missionId}`;
 let accessToken=localStorage.getItem(key);
 if(!accessToken){accessToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem(key,accessToken);}
 const revisionKey=`cyberMission.independentRevision.${mission.missionId}`;
 const response=await fetch(`/api/booth/independent/${mission.missionId}/${mission.currentStation}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:Number(localStorage.getItem(revisionKey)||0),...body,missionId:mission.missionId,accessToken}),signal:AbortSignal.timeout(8000)});
 const data=await response.json();
 if(!response.ok){const error=new Error(data.error||'Connection unavailable');error.status=response.status;error.conflict=data.conflict;throw error;}
 if(Number.isInteger(data.revision))localStorage.setItem(revisionKey,String(data.revision));
 return data;
}
