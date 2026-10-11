// Imported only by the DEV-gated adapter. No transport or real storage dependencies.
// Reuse the pure production transition function instead of maintaining a second rules engine.
import {recordIncidentResponse} from '../../../backend/src/station04Response.js';
import {recordVaultAction,publicVault} from '../../../backend/src/station04VaultFlow.js';
import {createNarrativeAssignment,narrativeClue,publicNarrativeAssignment,seededNarrativeRandom} from '../../../shared/narrativeAssignment.mjs';

export const PREVIEW_STORAGE_KEY='cyberMission.devPreview.station04.v1';
export const PREVIEW_PHASES=['intro','person','response','evidence','complete','vault','discovery'];
export const normalizePreviewPhase=phase=>PREVIEW_PHASES.includes(phase)?phase:'intro';
export const previewPhase=record=>record.vaultAssignment&&!record.vaultState?.discoveryAcknowledgedAt?(record.vaultState?.unlockedAt?'discovery':'vault'):record.mission.decisions.station04?.completedAt?'complete':record.mission.decisions.station04?.phase||'intro';

export function createPreviewRecord(language='ar',phase='intro',now=new Date().toISOString(),{seed='preview-default',assignment}={}){
 const missionId='CM-PREV04';
 const narrative=assignment||createNarrativeAssignment(seededNarrativeRandom(seed),now);
 const clue={id:'preview:payment-review',station:3,source:'mail',type:'mail',timestamp:now,
  title:{en:'October supplier payment review',ar:'مراجعة دفعة المورد لشهر أكتوبر'},
  description:{en:'I prepared the printed payment documents left on the desk for the Finance review.\nSara',ar:'أعددت مستندات الدفعة المطبوعة الموجودة على المكتب لمراجعة الإدارة المالية.\nسارة'},
  metadata:{from:'sara@example.com',senderName:{en:'Sara',ar:'سارة'}}};
 Object.assign(clue,narrativeClue(narrative));
 const associated=narrative.choices.find(p=>p.id===narrative.associatedPersonId);
 const record={devPreview:true,previewSeed:seed,stage:4,phase:'ACTIVE',revision:0,mission:{
  narrativeAssignment:narrative,
  missionId,language:language==='en'?'en':'ar',playerName:language==='en'?'Sara':'سارة',avatarId:'cyber-02',
  createdAt:now,startedAt:now,updatedAt:now,status:'active',currentStation:4,completedStations:[1,2,3],
  hiddenScore:0,hiddenAttackState:0,flags:{suspiciousLinkOpened:false,accountExposurePossible:false,phishingReported:true,legitimateMessageReported:false,unknownUsbConnected:false,physicalThreatContained:true,criticalEvidenceMissed:false,incidentReported:false},
  configSnapshot:{missionDurationSeconds:480,stationCount:4},evidence:[clue],
  decisions:{
   station01:{scenarioId:'SMS-PHISH-001',senderInspected:true,linkInspected:true,messageDetailsViewed:true,linkOpened:false,finalAction:'report',completedAt:now},
   station02:{items:Object.fromEntries([['usb','report'],['documents','secure'],['badge','report']].map(([id,actionId])=>[id,{actionId,recordedAt:now}])),completedAt:now},
   station03:{phase:'classification',inspectedIds:[clue.id],selectedIds:[clue.id],completedAt:now,dataDecisions:Object.fromEntries([['data-01','public','communicationsManager'],['data-03','restricted','financeManager']].map(([scenarioId,selectedClassification,selectedRoleId])=>[scenarioId,{scenarioId,missionId,classification:{selectedClassification,confirmedAt:now},sharing:{selectedRoleId,confirmedAt:now}}]))}
  },
  caseFile:{version:1,physicalClues:{documents:[[{en:'Prepared by',ar:'إعداد'},associated.name]]},records:[clue]}
 }};
 const target=normalizePreviewPhase(phase);
 if(['vault','discovery'].includes(target)){
  const caseId=String(seed).match(/case-0[1-4]/)?.[0]||'case-04',finance=caseId==='case-03';
  record.caseAssignment={definition:{id:caseId,steps:[{minute:-11}]}};
  const email=structuredClone(clue);
  email.description.en+='\n\nThe archived copy opens with the review reference on the '+(finance?'payment worksheet':'revised invoice')+', leaving out the first two digits. I left the working copy in the team folder.';
  email.description.ar+='\n\nتُفتح النسخة المؤرشفة بمرجع المراجعة المدوّن على '+(finance?'كشف المدفوعات':'الفاتورة المعدلة')+'، بعد حذف أول رقمين. تركت نسخة العمل في مجلد الفريق.';
  const document={id:'preview:invoice',title:finance?'Payments_Oct.xlsx':'Invoice_1048.pdf',timestamp:now,description:{en:'Horizon Environmental Services\nInvoice 1048 — revised copy\nField survey services: SAR 60,000\nAnalysis and reporting: SAR 24,000\nTotal: SAR 84,000\nPayment status: awaiting review\nReview reference: 590007',ar:'آفاق للخدمات البيئية\nالفاتورة 1048 — نسخة معدلة\nخدمات المسح الميداني: 60,000 ريال\nالتحليل وإعداد التقرير: 24,000 ريال\nالإجمالي: 84,000 ريال\nحالة الصرف: بانتظار المراجعة\nمرجع المراجعة: 590007'}};
  const distractorSets={
   'case-01':[
    ['Access_Request_317.pdf','OPERATIONS ACCESS REQUEST\nRequest No.: OP-317\nReference: 317842\nDate: 2026-10-10\nDepartment: Field Operations\nVisitor count: 3\nStatus: Approved by Facilities','طلب دخول العمليات\nرقم الطلب: OP-317\nالمرجع: 317842\nالتاريخ: 2026-10-10\nالإدارة: العمليات الميدانية\nعدد الزوار: 3\nالحالة: معتمد من إدارة المرافق'],
    ['Invoice_8842.pdf','OPERATIONS MAINTENANCE INVOICE\nInvoice No.: 8842\nRecord: 884219\nDate: 2026-10-10\nCost centre: OPS-14\nAmount: SAR 4,860\nApproval: Facilities review pending','فاتورة صيانة العمليات\nرقم الفاتورة: 8842\nرقم السجل: 884219\nالتاريخ: 2026-10-10\nمركز التكلفة: OPS-14\nالمبلغ: 4,860 ريال\nالاعتماد: بانتظار مراجعة المرافق']],
   'case-02':[
    ['Benefits_Request_731.pdf','EMPLOYEE BENEFITS REQUEST\nRequest No.: HR-731\nTracking reference: 731426\nDate: 2026-10-10\nEmployee group: Staff benefits\nItems requested: 2\nStatus: Awaiting HR approval','طلب مزايا الموظفين\nرقم الطلب: HR-731\nمرجع المتابعة: 731426\nالتاريخ: 2026-10-10\nالفئة: مزايا الموظفين\nعدد البنود المطلوبة: 2\nالحالة: بانتظار اعتماد الموارد البشرية'],
    ['Booking_2048.pdf','EMPLOYEE SERVICES ROOM BOOKING\nBooking No.: 2048\nReservation reference: 204863\nDate: 2026-10-10\nRoom: Cedar-2\nAttendees: 8\nStatus: Confirmed · 14:00–15:30','حجز قاعة خدمات الموظفين\nرقم الحجز: 2048\nمرجع الحجز: 204863\nالتاريخ: 2026-10-10\nالقاعة: سيدار-2\nعدد الحضور: 8\nالحالة: مؤكد · 14:00–15:30']],
   'case-03':[
    ['Supplier_Invoice_7719.pdf','SUPPLIER EQUIPMENT INVOICE\nInvoice No.: 7719\nSupplier record: 771943\nDate: 2026-10-10\nDepartment: Finance Procurement\nAmount: SAR 12,740\nApproval: Three-way match pending','فاتورة معدات المورد\nرقم الفاتورة: 7719\nسجل المورد: 771943\nالتاريخ: 2026-10-10\nالإدارة: مشتريات المالية\nالمبلغ: 12,740 ريال\nالاعتماد: بانتظار المطابقة الثلاثية'],
    ['Approval_Request_4382.pdf','FINANCE APPROVAL REQUEST\nRequest No.: FIN-4382\nControl reference: 438271\nDate: 2026-10-10\nCost centre: FIN-09\nRequested amount: SAR 2,180\nStatus: Pending manager approval','طلب اعتماد مالي\nرقم الطلب: FIN-4382\nمرجع الرقابة: 438271\nالتاريخ: 2026-10-10\nمركز التكلفة: FIN-09\nالمبلغ المطلوب: 2,180 ريال\nالحالة: بانتظار اعتماد المدير']],
   'case-04':[
    ['Handover_Checklist_562.pdf','PROJECT HANDOVER CHECKLIST\nChecklist No.: PL-562\nControl reference: 562317\nDate: 2026-10-10\nProject phase: Close-out\nItems checked: 12 of 12\nStatus: Awaiting project manager sign-off','قائمة تدقيق تسليم المشروع\nرقم القائمة: PL-562\nمرجع الرقابة: 562317\nالتاريخ: 2026-10-10\nمرحلة المشروع: الإغلاق\nالبنود المفحوصة: 12 من 12\nالحالة: بانتظار توقيع مدير المشروع'],
    ['Room_Booking_9184.pdf','PROJECT REVIEW ROOM RESERVATION\nBooking No.: 9184\nReservation reference: 918472\nDate: 2026-10-10\nRoom: Atlas-4\nAttendees: 11\nStatus: Confirmed · 09:30–11:00','حجز قاعة مراجعة المشروع\nرقم الحجز: 9184\nمرجع الحجز: 918472\nالتاريخ: 2026-10-10\nالقاعة: أطلس-4\nعدد الحضور: 11\nالحالة: مؤكد · 09:30–11:00']]
  };
  const distractors=distractorSets[caseId].map(([title,en,ar],index)=>({id:`preview:distractor:${index+1}`,title,timestamp:now,description:{en,ar}}));
  record.vaultAssignment={version:1,code:'0007',reviewReference:'590007',clueSources:{email,document,documents:[document,...distractors]}};
  if(target==='discovery')recordVaultAction(record,{action:'vault-attempt',code:'0007',requestId:'preview-unlock'},now);
  return record;
 }
 if(target==='intro')return record;
 recordIncidentResponse(record,{action:'begin-response'},now);
 for(const [current,selection]of [['person',narrative.associatedPersonId],['response','notify_cybersecurity'],['evidence','preserve_and_follow_instructions']]){
  if(target===current)break;
  recordIncidentResponse(record,{action:'select-response',phase:current,selection},now);
  recordIncidentResponse(record,{action:current==='evidence'?'submit-response':'advance-response'},now);
 }
 return record;
}

export function applyPreviewAction(record,payload){
 if(!record.devPreview)throw new Error('Preview record required');
 const next=structuredClone(record);
 if(payload.action.startsWith('vault-')){
  recordVaultAction(next,payload);
  if(payload.action==='vault-continue'&&!next.mission.decisions.station04)recordIncidentResponse(next,{action:'begin-response'});
 }else recordIncidentResponse(next,payload);
 next.revision++;
 return next;
}

export function previewMission(record){
 const mission=structuredClone(record.mission);
 mission.narrativeAssignment=publicNarrativeAssignment(mission.narrativeAssignment);
 if(mission.decisions.station04)delete mission.decisions.station04.privateScore;
 delete mission.hiddenScore;
 const vault=publicVault(record);if(vault)mission.vault=vault;
 return mission;
}

export function restorePreviewRecord(raw,language,phase,seed='preview-default'){
 try{
  const record=JSON.parse(raw);
  if(record?.devPreview===true&&record.mission?.missionId==='CM-PREV04'&&record.mission.narrativeAssignment&&record.previewSeed===seed){
   if(previewPhase(record)!==normalizePreviewPhase(phase))return createPreviewRecord(language,phase,undefined,{seed,assignment:record.mission.narrativeAssignment});
   record.mission.language=language;record.mission.playerName=language==='en'?'Sara':'سارة';return record;
  }
 }catch{/* A damaged preview never falls back to a real mission. */}
 return createPreviewRecord(language,phase,undefined,{seed});
}
