import {randomInt} from 'node:crypto';
import {CASES, CASE_VERSION} from './caseDefinitions.js';
import {PEOPLE, CONTAINMENT, text} from '../../shared/casePeople.mjs';
import {buildInvestigation} from '../../shared/station03Content.mjs';
import {SMS_SCENARIOS as LEGACY_SMS_SCENARIOS} from '../../frontend/src/data/smsScenarios.js';
import {ACTIVE_SMS_SCENARIOS} from '../../frontend/src/data/activeSmsScenarios.js';
import {financeTemplate,station03TemplateRecords} from './station03Cases.js';
import {publicStation03Experience} from './station03Experience.js';
import {publicNarrativeAssignment} from '../../shared/narrativeAssignment.mjs';
import {publicVault} from './station04VaultFlow.js';
import {missionTimerSnapshot} from './missionTimer.js';
import {station04Result} from './station04Result.js';

export function assignCase(state, record) {
 if(record.caseAssignment)return;
 const scenarioId=record.mission.decisions?.station01?.scenarioId;
 if(!ACTIVE_SMS_SCENARIOS.some(s=>s.id===scenarioId)&&!LEGACY_SMS_SCENARIOS.some(s=>s.id===scenarioId))return;
 if(!state.caseBag?.length){
  state.caseBag=CASES.map(c=>c.id);
  for(let i=state.caseBag.length-1;i>0;i--){const j=randomInt(i+1);[state.caseBag[i],state.caseBag[j]]=[state.caseBag[j],state.caseBag[i]];}
 }
 const caseId=state.caseBag.pop();
 const definition=CASES.find(c=>c.id===caseId);
 record.caseAssignment={version:CASE_VERSION,assignedAt:new Date().toISOString(),definition:structuredClone(definition)};
 if(definition.id==='case-03')record.caseAssignment.station03=financeTemplate(definition);
}
export function caseCatalog(record) {
 const mission=record.mission,c=record.caseAssignment?.definition;
 if(!c)return buildInvestigation(mission);
 const person=PEOPLE.find(p=>p.id===c.personId),start=Date.parse(mission.startedAt);
 const at=minutes=>new Date(start+minutes*60000).toISOString();
 const rows=[];
 const add=(id,source,title,description,type,minute,metadata={},relevant=false)=>rows.push({id:`case:${id}`,source,title,description,type,timestamp:at(minute),metadata,isIncidentRelevant:relevant,relatedDecision:null});
 // Every person has ordinary mail, a document and an access entry. None is the only visible person.
 for(const [index,p] of PEOPLE.entries()){
  add(`${p.id}:mail`,'mail',text(`${p.name.en}: team update`,`${p.name.ar}: مستجدات الفريق`),text('The team meeting is scheduled for next week. No account change is requested.','اجتماع الفريق مقرر للأسبوع القادم. لا يتضمن البريد طلبًا لتغيير الحساب.'),'mail',-100-index*3,{from:p.account});
  add(`${p.id}:document`,'documents',`${p.id}_Training_Notes.pdf`,text(`Workshop notes prepared by ${p.name.en}.`, `ملاحظات ورشة عمل أعدّها ${p.name.ar}.`),'pdf',-90-index*3,{owner:p.name,device:p.device});
  add(`${p.id}:signin`,'logs',text(`${p.name.en}: signed in`,`${p.name.ar}: تسجيل دخول`),text('A normal work session started on the assigned workstation.','بدأت جلسة عمل على الجهاز المخصّص.'),'access',-70-index*3,{device:p.device,account:p.account});
 }
 add('directory','documents','Workstation_Directory.pdf',text(PEOPLE.map(p=>`${p.name.en} / ${p.department.en} / ${p.device} / ${p.account}`).join('\n'),PEOPLE.map(p=>`${p.name.ar} / ${p.department.ar} / ${p.device} / ${p.account}`).join('\n')),'pdf',-180,{},true);
 add('training','downloads','Training_Schedule.pdf',text('Next month’s training schedule, shared through the internal learning portal.','جدول التدريب للشهر القادم، منشور عبر بوابة التعلم الداخلية.'),'pdf',-60,{domain:'learning.example.com'});
 add('payroll','documents','Payroll_Summary.xlsx',text('Protected document. Contents are unavailable in this workstation session.','مستند محمي. محتوياته غير متاحة في جلسة العمل الحالية.'),'protected',-120,{access:'Restricted'});
 add('keyboard','devices',text('Office keyboard','لوحة مفاتيح المكتب'),text('Assigned office equipment.','جهاز مكتبي مخصّص للعمل.'),'device',-180,{device:'KB-014'});
 add('headset','devices',text('Office headset','سماعة المكتب'),text('Assigned meeting equipment.','جهاز مخصّص للاجتماعات.'),'device',-175,{device:'HS-014'});
 add('old-menu','bin','Cafeteria_Menu.pdf',text('Last month’s cafeteria menu was removed during routine cleanup.','حُذفت قائمة الكافتيريا للشهر الماضي أثناء ترتيب الملفات.'),'deleted',-55);
 add('draft','bin','Meeting_Draft.docx',text('An earlier draft was replaced by the approved meeting notes.','استُبدلت مسودة سابقة بمحضر الاجتماع المعتمد.'),'deleted',-50);
 for(const step of c.steps)add(step.id,step.source,step.title,step.description,step.type,step.minute,{...step.metadata,account:person.account},true);
 // Participant-generated events are separate, later records, not invented causes of the historical case.
 const generatedRecords=buildInvestigation(mission);
 for(const row of generatedRecords.filter(row=>row.relatedDecision)){
  const {event,...metadata}=row.metadata;
  rows.push({...row,metadata:{...metadata,account:person.account},description:row.relatedDecision==='station01.linkOpened'?text('This address was opened during your Station 01 message interaction. It does not prove a form was submitted or a file executed.','فُتح هذا العنوان أثناء تفاعلك مع رسالة المحطة 01. لا يثبت ذلك إرسال نموذج أو تشغيل ملف.'):text('This connection was recorded after your desk decision. It is separate from the earlier activity in this case.','سُجّل هذا الاتصال بعد قرارك في المكتب، وهو مستقل عن النشاط السابق في هذه القضية.')});
 }
 const templateRows=station03TemplateRecords(record);
 const authoredMailIds=new Set(['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination']);
 const authoredMail=generatedRecords.filter(row=>authoredMailIds.has(row.id));
 if(!templateRows)return [...rows,...authoredMail];
 return [...templateRows,...rows.filter(row=>row.relatedDecision),...authoredMail];
}
export function physicalClues(record){
 const c=record.caseAssignment?.definition;if(!c)return null;
 const badge=PEOPLE.find(p=>p.id===c.badgeId),document=PEOPLE.find(p=>p.id===c.documentId);
 const assignment=record.mission.narrativeAssignment;
 const preparer=assignment?.choices.find(p=>p.id===assignment.associatedPersonId)?.name||text('Sara','سارة');
 return {
  badge:[['Name',badge.name],['Department',badge.department],['Assigned workstation',badge.device]],
  documents:[['Reference',c.reference],[text('Prepared by','إعداد'),preparer],['Employee',document.name],['Workstation',PEOPLE.find(p=>p.id===c.personId).device],['Notes',c.physical]]
 };
}
export function publicMission(record){
 if(!record)return null;
 const m=structuredClone(record.mission);
 delete m.station04Result;
 const finalFeedback=station04Result(record);if(finalFeedback)m.station04Result=finalFeedback;
 m.timer=missionTimerSnapshot(record);
 if(record.mode==='independent-v1'){m.independent=true;m.timer.activeMs=record.timer.activeMs;if(record.phase==='COMPLETED')m.finalScore={total:record.scoring?.total||0,maximum:5000,stations:Object.fromEntries(Object.entries(record.scoring?.stations||{}).map(([id,score])=>[id,{earned:score.earned,maximum:score.maximum}]))};}
 delete m.vaultAssignment;
 delete m.vault;delete m.vaultState;
 const vault=publicVault(record);if(vault)m.vault=vault;
 if(m.narrativeAssignment)m.narrativeAssignment=publicNarrativeAssignment(m.narrativeAssignment);
 if([2,3].includes(m.decisions?.station04?.version)){delete m.decisions.station04.privateScore;delete m.decisions.station04.legacyDecisions;}
 if(m.decisions?.station03)delete m.decisions.station03.legacyDataChallenge;
 if(record.stage===3&&record.station03Experience)m.station03Experience=publicStation03Experience(record);
 const hideExpected=value=>Array.isArray(value)?value.map(hideExpected):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['expectedClassification','expectedRoleId','dataChallengeScore'].includes(key)).map(([key,item])=>[key,hideExpected(item)])):value;
 if(!record.caseAssignment)return hideExpected(m);
 m.caseId=record.caseAssignment.definition.id;
 if(record.caseAssignment.station03){const {id,version,minimumEvidence}=record.caseAssignment.station03;m.investigationCase={id,version,minimumEvidence};}
 m.caseFile={version:record.caseAssignment.version,people:PEOPLE,physicalClues:physicalClues(record),records:caseCatalog(record).map(({isIncidentRelevant,relatedDecision,expectedClassification,...row})=>({...row,...(expectedClassification?{requiresClassification:true}:{})}))};
 const station03Rows=record.station03Experience?.rows||[];
 const savedStation03Evidence=Array.isArray(m.evidence)?m.evidence:Object.values(m.evidence||{}).flatMap(value=>Array.isArray(value)?value:[]);
 const selectedStation03Ids=new Set(Array.isArray(m.decisions.station03?.selectedIds)?m.decisions.station03.selectedIds:savedStation03Evidence.filter(item=>item.station===3).map(item=>item.id));
 const station03Content=new Map(station03Rows.map(row=>[row.id,row.description]));
 const addSelectedDescriptions=items=>items.map(item=>{
  const description=selectedStation03Ids.has(item.id)?station03Content.get(item.id):null;
  return item.station===3&&description&&!item.description?{...item,description}:item;
 });
 if(Array.isArray(m.evidence))m.evidence=addSelectedDescriptions(m.evidence);
 else if(m.evidence?.station03)m.evidence.station03=addSelectedDescriptions(m.evidence.station03);
 // New case missions expose neither raw scores nor hidden evidence tags before the final reveal.
 if(record.stage>1)delete m.hiddenScore;delete m.scoreBreakdown;
 const clean=rows=>rows.map(({isIncidentRelevant,relatedDecision,...row})=>{
   if(row.classification){const {expectedClassification,...decision}=row.classification;row.classification=decision;}
   return row;
 });
 if(m.decisions.station03?.classifications)m.decisions.station03.classifications=Object.fromEntries(Object.entries(m.decisions.station03.classifications).map(([id,{expectedClassification,...decision}])=>[id,decision]));
 if(Array.isArray(m.evidence))m.evidence=clean(m.evidence);
 else if(m.evidence?.station03)m.evidence.station03=clean(m.evidence.station03);
 if(record.phase==='COMPLETED'&&record.result&&m.decisions?.station04?.version!==2)m.caseResult=structuredClone(record.result);
 return hideExpected(m);
}
const clamp=(value,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.round(value))):0;
export function scoreCase(record){
 const m=record.mission,s1=m.decisions.station01||{},s2=m.decisions.station02?.items||{},s3=m.decisions.station03||{},s4=m.decisions.station04||{};
 const catalog=s1.catalogVersion==='v2'?ACTIVE_SMS_SCENARIOS:LEGACY_SMS_SCENARIOS;
 const classification=(catalog.find(s=>s.id===s1.scenarioId)||ACTIVE_SMS_SCENARIOS.find(s=>s.id===s1.scenarioId))?.classification;
 const inspections=(s1.senderInspected?25:0)+(s1.messageDetailsViewed?25:0)+(s1.link?.exists?(s1.linkInspected?30:0):(s1.messageDetailsViewed?30:0));
 const finals=classification==='phishing'?{report:120,block:70,delete:50,continue:0,openLink:0}:{continue:120,openLink:100,delete:40,block:20,report:30};
 const station01=clamp(inspections+(Object.hasOwn(finals,s1.finalAction)?finals[s1.finalAction]:0)-(classification==='phishing'&&s1.linkOpened?70:0),200);
 // Six decisions share 250 points. Skipped objects do not earn automatic credit; no click-for-points.
 const safe={usb:{report:1,leave:.6,connect:0},badge:{report:1,leave:.2,use:0},documents:{secure:1,report:1,leave:.1,read:0},cable:{report:1,leave:.7,connect:0},qr:{report:1,leave:.7,scan:0},power:{report:1,leave:.7,use:0}};
 const station02=clamp(Object.entries(safe).reduce((sum,[id,actions])=>sum+(Object.hasOwn(actions,s2[id]?.actionId)?actions[s2[id].actionId]:0),0)*250/6,250);
 const c=record.caseAssignment.definition,rows=caseCatalog(record),chosen=new Set(s3.selectedIds||[]),core=c.steps.map(s=>`case:${s.id}`);
 const relevant=rows.filter(r=>r.isIncidentRelevant),hits=relevant.filter(r=>chosen.has(r.id)),distractors=rows.filter(r=>!r.isIncidentRelevant&&chosen.has(r.id));
 const sources=new Set(hits.map(r=>r.source)).size;
 const station03=clamp(core.filter(id=>chosen.has(id)).length*60+(chosen.has('case:directory')?30:0)+(sources>=2?30:0)-Math.min(60,distractors.length*12),300);
 const timeline=(s4.timeline||[]).filter(id=>id&&core.includes(id));
 let pairs=0,ordered=0;for(let i=0;i<timeline.length;i++)for(let j=i+1;j<timeline.length;j++){pairs++;if(core.indexOf(timeline[i])<core.indexOf(timeline[j]))ordered++;}
 const reconstruction=clamp(90*(timeline.length/4)*(pairs?ordered/pairs:1),90);
 const actions=s4.containment||[],expected=c.containment;
 const containment=clamp(80*actions.filter(id=>expected.includes(id)).length/expected.length-actions.filter(id=>['delete','retry'].includes(id)).length*20,80);
 const station04=clamp((s4.personId===c.personId?80:0)+reconstruction+containment,250);
 const breakdown={station01,station02,station03,station04},total=Object.values(breakdown).reduce((a,b)=>a+b,0);
 return {breakdown,total,containment,core,relevant,hits,distractors};
}
export function recordResolution(record,body,now=new Date().toISOString()){
 const m=record.mission;if(!record.caseAssignment)throw new Error('This earlier mission has no connected case');
 const old=m.decisions.station04||{phase:1,personId:null,timeline:[null,null,null,null],containment:[],startedAt:now};
 if(old.completedAt)throw new Error('Case already submitted');
 const next=structuredClone(old),selected=m.decisions.station03?.selectedIds||[];
 switch(body.action){
  case 'person':if(!PEOPLE.some(p=>p.id===body.personId))throw new Error('Choose a person');next.personId=body.personId;break;
  case 'timeline':if(!Array.isArray(body.timeline)||body.timeline.length!==4||body.timeline.some(id=>id!==null&&!selected.includes(id))||new Set(body.timeline.filter(Boolean)).size!==body.timeline.filter(Boolean).length)throw new Error('Use each collected item once');next.timeline=body.timeline;break;
  case 'containment':if(!Array.isArray(body.containment)||body.containment.some(id=>!CONTAINMENT.some(a=>a.id===id))||new Set(body.containment).size!==body.containment.length)throw new Error('Choose valid containment actions');next.containment=body.containment;break;
  case 'phase':if(![1,2,3].includes(body.phase)||body.phase>1&&!next.personId)throw new Error('Choose a person');next.phase=body.phase;break;
  case 'submit':if(!next.personId||!next.containment.length||next.phase!==3)throw new Error('Complete the case choices first');next.completedAt=now;break;
  default:throw new Error('Unknown case action');
 }
 m.decisions.station04=next;m.updatedAt=now;
 if(body.action==='submit'){
  const result=scoreCase(record),c=record.caseAssignment.definition;
  m.hiddenScore=result.total;m.status='complete';m.completedStations=[...new Set([...m.completedStations,4])];
  record.phase='COMPLETED';
  record.result={total:result.total,breakdown:result.breakdown,outcome:result.total>=780&&result.containment>=50&&next.personId===c.personId?'contained':result.total>=500?'partial':'review',personId:c.personId,device:PEOPLE.find(p=>p.id===c.personId).device,summary:c.summary,selectedPerson:next.personId,timeline:result.core.map(id=>caseCatalog(record).find(r=>r.id===id)),collected:result.hits,missed:result.relevant.filter(r=>!selected.includes(r.id)),distractors:result.distractors,containment:next.containment,expectedContainment:c.containment,completedAt:now};
 }
}
