import {randomInt} from 'node:crypto';
import {createVaultCodeAssignmentV3,decoyReference,vaultRule} from './station04VaultRules.js';
import {bindVaultMail} from './station04VaultMail.js';

// Private record sibling, never part of mission/publicStation03Experience.
// Only the new-record creation boundary may opt a mission into this version.
export function initializeVaultAssignment(record,{newMission=false,random=randomInt}={}){
 if(!newMission||record.vaultAssignment)return;
 const {ruleId,reference,code}=createVaultCodeAssignmentV3(random);
 const choices=record.mission.narrativeAssignment?.choices;
 if(!choices?.length)throw new Error('Vault requires the saved case identities');
 const pick=n=>((random(n)%n)+n)%n;
 const sender=structuredClone(choices[pick(choices.length)]),templateIndex=pick(3);
 record.vaultAssignment={version:1,contentVersion:3,assignedAt:new Date().toISOString(),ruleId,reference,code,sender,templateIndex,
  reviewReference:reference,clueSources:null};
}

// Run once after the existing narrative/readability transforms on a NEW snapshot.
// Preserve IDs, relevance, timestamps, filenames, and all evidence decisions.
export function bindVaultClues(record){
 const vault=record.vaultAssignment;
 if(vault?.version!==1||vault.clueSources)return;
 const definition=record.caseAssignment?.definition,rows=record.station03Experience?.rows;
 if(!definition||!rows)throw new Error('Vault clues require an initialized case snapshot');
 const finance=definition.id==='case-03';
 const mail=rows.find(r=>r.id===(finance?'finance:review-mail':`case:${definition.personId}:mail`));
 const document=rows.find(r=>r.id===(finance?'case:export':'case:reem:document'));
 if(!mail||!document||document.title!==(finance?'Payments_Oct.xlsx':'Invoice_1048.pdf'))throw new Error('Vault clue source is unavailable');
 const rule=vault.contentVersion>=2?vaultRule(vault.ruleId):null;
 const note=rule?{
  en:`${rule.en}`,
  ar:`${rule.ar}`
 }:{
  en:'Use the review reference with the first two digits left out.',
  ar:'استخدم مرجع المراجعة بعد حذف أول رقمين منه.'
 }; for(const [lang,label] of [['en','Review reference'],['ar','مرجع المراجعة']]){
  document.description[lang]+=`\n${label}: ${vault.reviewReference}`;
 }
 // Source copies for the archive-reference viewer. These are not
 // collected evidence and do not change Station 03 selection or its score.
 const date=new Date(document.timestamp).toISOString().slice(0,10);
 const code=Number(vault.code);
 const legacyReference=(seed)=>{
  let value=100000+((seed*7919+code*17)%900000);
  while(String(value).slice(-4)===vault.code)value=100000+((value-100000+137)%900000);
  return String(value).padStart(6,'0');
 };
 const safeReference=rule?seed=>decoyReference(vault.ruleId,vault.reference,vault.code,seed):legacyReference;
 const distractors={
  'case-01':[
   ['Access_Request_317.pdf',safeReference(317),{
    en:`OPERATIONS ACCESS REQUEST\nRequest No.: OP-317\nReference: ${safeReference(317)}\nDate: ${date}\nDepartment: Field Operations\nVisitor count: 3\nStatus: Approved by Facilities`,
    ar:`طلب دخول العمليات\nرقم الطلب: OP-317\nالمرجع: ${safeReference(317)}\nالتاريخ: ${date}\nالإدارة: العمليات الميدانية\nعدد الزوار: 3\nالحالة: معتمد من إدارة المرافق` }],
   ['Invoice_8842.pdf',safeReference(8842),{
    en:`OPERATIONS MAINTENANCE INVOICE\nInvoice No.: 8842\nRecord: ${safeReference(8842)}\nDate: ${date}\nCost centre: OPS-14\nAmount: SAR 4,860\nApproval: Facilities review pending`,
    ar:`فاتورة صيانة العمليات\nرقم الفاتورة: 8842\nرقم السجل: ${safeReference(8842)}\nالتاريخ: ${date}\nمركز التكلفة: OPS-14\nالمبلغ: 4,860 ريال\nالاعتماد: بانتظار مراجعة المرافق` }]],
  'case-02':[
   ['Benefits_Request_731.pdf',safeReference(731),{
    en:`EMPLOYEE BENEFITS REQUEST\nRequest No.: HR-731\nTracking reference: ${safeReference(731)}\nDate: ${date}\nEmployee group: Staff benefits\nItems requested: 2\nStatus: Awaiting HR approval`,
    ar:`طلب مزايا الموظفين\nرقم الطلب: HR-731\nمرجع المتابعة: ${safeReference(731)}\nالتاريخ: ${date}\nالفئة: مزايا الموظفين\nعدد البنود المطلوبة: 2\nالحالة: بانتظار اعتماد الموارد البشرية` }],
   ['Booking_2048.pdf',safeReference(2048),{
    en:`EMPLOYEE SERVICES ROOM BOOKING\nBooking No.: 2048\nReservation reference: ${safeReference(2048)}\nDate: ${date}\nRoom: Cedar-2\nAttendees: 8\nStatus: Confirmed · 14:00–15:30`,
    ar:`حجز قاعة خدمات الموظفين\nرقم الحجز: 2048\nمرجع الحجز: ${safeReference(2048)}\nالتاريخ: ${date}\nالقاعة: سيدار-2\nعدد الحضور: 8\nالحالة: مؤكد · 14:00–15:30` }]],
  'case-03':[
   ['Supplier_Invoice_7719.pdf',safeReference(7719),{
    en:`SUPPLIER EQUIPMENT INVOICE\nInvoice No.: 7719\nSupplier record: ${safeReference(7719)}\nDate: ${date}\nDepartment: Finance Procurement\nAmount: SAR 12,740\nApproval: Three-way match pending`,
    ar:`فاتورة معدات المورد\nرقم الفاتورة: 7719\nسجل المورد: ${safeReference(7719)}\nالتاريخ: ${date}\nالإدارة: مشتريات المالية\nالمبلغ: 12,740 ريال\nالاعتماد: بانتظار المطابقة الثلاثية` }],
   ['Approval_Request_4382.pdf',safeReference(4382),{
    en:`FINANCE APPROVAL REQUEST\nRequest No.: FIN-4382\nControl reference: ${safeReference(4382)}\nDate: ${date}\nCost centre: FIN-09\nRequested amount: SAR 2,180\nStatus: Pending manager approval`,
    ar:`طلب اعتماد مالي\nرقم الطلب: FIN-4382\nمرجع الرقابة: ${safeReference(4382)}\nالتاريخ: ${date}\nمركز التكلفة: FIN-09\nالمبلغ المطلوب: 2,180 ريال\nالحالة: بانتظار اعتماد المدير` }]],
  'case-04':[
   ['Handover_Checklist_562.pdf',safeReference(562),{
    en:`PROJECT HANDOVER CHECKLIST\nChecklist No.: PL-562\nControl reference: ${safeReference(562)}\nDate: ${date}\nProject phase: Close-out\nItems checked: 12 of 12\nStatus: Awaiting project manager sign-off`,
    ar:`قائمة تدقيق تسليم المشروع\nرقم القائمة: PL-562\nمرجع الرقابة: ${safeReference(562)}\nالتاريخ: ${date}\nمرحلة المشروع: الإغلاق\nالبنود المفحوصة: 12 من 12\nالحالة: بانتظار توقيع مدير المشروع` }],
   ['Room_Booking_9184.pdf',safeReference(9184),{
    en:`PROJECT REVIEW ROOM RESERVATION\nBooking No.: 9184\nReservation reference: ${safeReference(9184)}\nDate: ${date}\nRoom: Atlas-4\nAttendees: 11\nStatus: Confirmed · 09:30–11:00`,
    ar:`حجز قاعة مراجعة المشروع\nرقم الحجز: 9184\nمرجع الحجز: ${safeReference(9184)}\nالتاريخ: ${date}\nالقاعة: أطلس-4\nعدد الحضور: 11\nالحالة: مؤكد · 09:30–11:00` }]]
 }[definition.id];
 const archiveDocuments=[structuredClone(document),...distractors.map(([filename,reference,description],index)=>({
  id:`vault:distractor:${definition.id}:${index+1}`,source:'documents',title:filename,
  description,metadata:{reference},
  type:'pdf',timestamp:document.timestamp
 }))];
 // Existing content versions keep their original document-note behavior.
 // V3 puts the clue in Station 03 correspondence only; the archive gets the reference.
 const archiveNote={en:'Archive access note',ar:'ملاحظة الأرشفة'};
 if(vault.contentVersion===3)bindVaultMail(record,mail,document);
 else for(const lang of ['en','ar'])archiveDocuments[0].description[lang]+=`\n${archiveNote[lang]}: ${note[lang]}`;
 vault.clueSources={email:null,document:structuredClone(document),documents:archiveDocuments};
}

export {vaultEnabled,isVaultReplay,recordVaultAction,publicVault} from './station04VaultFlow.js';
