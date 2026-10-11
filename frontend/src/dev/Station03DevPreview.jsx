import {useState} from 'react';
import {assignDataChallenge,publicDataChallenge} from '../../../backend/src/station03Sharing.js';
import {recordInvestigation} from '../../../backend/src/station03Investigation.js';
import Station03 from '../stations/Station03/Station03.jsx';
import {LanguageProvider} from '../locales/LanguageProvider.jsx';
const key='cyberMission.devPreview.station03.v2';
const params=new URLSearchParams(location.search),phase=params.get('phase')||'investigation';
const language=params.get('lang')==='en'?'en':'ar';
function createRecord(){
 const startedAt=new Date().toISOString(),missionId='CM-PREV03',challenge=assignDataChallenge(startedAt);
 const records=[
  {id:'preview:notes',source:'documents',type:'pdf',title:'Notes.pdf',description:{en:'Site visits\nTen sites were visited this month. Two water readings remain outstanding.',ar:'الزيارات الميدانية\nتمت زيارة عشرة مواقع هذا الشهر، وما زالت قراءتان لاستهلاك المياه قيد الاستكمال.'},timestamp:startedAt,metadata:{}},
  {id:'preview:mail',source:'mail',type:'mail',title:{en:'Thursday review',ar:'مراجعة الخميس'},description:{en:'Hello,\nPlease review Notes.pdf before our Thursday meeting.\nThank you,\nNora',ar:'السلام عليكم،\nيرجى مراجعة Notes.pdf قبل اجتماع الخميس.\nشكرًا،\nنورة'},timestamp:startedAt,metadata:{from:'nora@example.com',senderName:{en:'Nora',ar:'نورة'}}}
 ];
 const mission={missionId,language,playerName:language==='ar'?'سارة':'Sara',avatarId:'cyber-02',status:'active',currentStation:3,completedStations:[1,2],startedAt,createdAt:startedAt,configSnapshot:{missionDurationSeconds:480,stationCount:4},hiddenScore:0,hiddenAttackState:0,flags:{},decisions:{station03:{phase:phase==='investigation'?'investigation':'classification',startedAt,inspectedIds:[],selectedIds:[]}},evidence:[]};
 const policy={rows:records,requiredDocumentIds:[],dataChallenge:challenge,minimumEvidence:0};
 const count=phase==='q3'?2:phase==='q2'?1:0;
 for(let i=0;i<count;i++)recordInvestigation(mission,'answer',challenge.questions[i].id,startedAt,records,challenge.questions[i].options[0].id,policy);
 return {mission,policy,phase};
}
function initial(){
 try{const saved=JSON.parse(sessionStorage.getItem(key));if(saved?.phase===phase){saved.mission.language=language;return saved;}}catch{}
 sessionStorage.removeItem('cyberMission.station03.documentRead:CM-PREV03');
 return createRecord();
}
export default function Station03DevPreview(){
 const [record,setRecord]=useState(initial),[error,setError]=useState('');
 async function act(action,id,answer){
  try{
   const next=structuredClone(record);
   recordInvestigation(next.mission,action,id,new Date().toISOString(),next.policy.rows,answer,next.policy);
   sessionStorage.setItem(key,JSON.stringify(next));setRecord(next);setError('');return true;
  }catch(e){setError(e.message);return false;}
 }
 const mission={...record.mission,language,station03Experience:{version:4,records:record.policy.rows,dataChallenge:publicDataChallenge(record.policy.dataChallenge)}};
 return <LanguageProvider language={language}><Station03 mission={mission} onAction={act} completed={!!mission.decisions.station03.completedAt} error={error}/></LanguageProvider>;
}
