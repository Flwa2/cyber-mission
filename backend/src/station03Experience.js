import {assignDataChallenge,publicDataChallenge} from './station03Sharing.js';
import {bindNarrativeClue} from './narrativeAssignment.js';
import {text} from '../../shared/casePeople.mjs';
import {refineStation03Workplace} from './station03Workplace.js';
import {renameStation03Files} from '../../shared/station03Filenames.mjs';
import {bindVaultClues} from './station04Vault.js';

// Station 03 content snapshot. Connected-case IDs, relevance and scoring remain intact.
export function ensureStation03Experience(record, catalog) {
 if(!record||record.stage!==3||record.mission.decisions.station03?.completedAt)return;
 if(record.station03Experience){
  if(record.station03Experience.version<4){
   const station=record.mission.decisions.station03;
   // Preserve the content of documents already being classified.
   record.station03Experience.rows=station?.phase==='classification'||Object.keys(station?.classifications||{}).length?renameStation03Files(record.station03Experience.rows):refineStation03Workplace(record.station03Experience.rows);
   record.station03Experience.version=4;
   const evidence=record.mission.evidence;
   if(Array.isArray(evidence))record.mission.evidence=evidence.map(item=>item.station===3?renameStation03Files(item):item);
   else if(evidence?.station03)evidence.station03=renameStation03Files(evidence.station03);
  }
  ensureDataChallenge(record);
  bindNarrativeClue(record);
  return;
 }
 const rows=structuredClone(catalog),start=Date.parse(record.mission.startedAt);
 const at=minutes=>new Date(start+minutes*60000).toISOString();
 for(const row of rows){
  if(row.relatedDecision){
   row.description=row.metadata.url?text('The browser opened the address recorded below.','فتح المتصفح العنوان المسجّل أدناه.'):text(`Device ${row.metadata.device} was connected to the workstation.`, `تم توصيل الجهاز ${row.metadata.device} بمحطة العمل.`);
  }else if(row.description&&typeof row.description==='object'){
   // Remove interpretive sentences, retaining the actual record and its metadata.
   for(const lang of ['en','ar'])row.description[lang]=row.description[lang].split(/(?<=[.!؟])\s+/).filter(sentence=>!/(does not (prove|identify|show)|do not establish|confirms|proves|separate.*event|No action is required|No account change|No request to change|Disclosure could|لا (يثبت|يحدّد|يلزم|يتضمن طلب)|لا يوجد إجراء|مستقل عن|قد يكشف الإفصاح)/i.test(sentence)).join(' ').replace(/A normal work session/gi,'A work session').replace('جلسة عمل عادية','جلسة عمل');
  }
 }
 // Presentation content is snapshotted per mission; original case IDs and clues remain stable.
 const documentCopy={
  'finance:public-report':['Environmental_Initiative_Review.pdf',text('Environment Fund — annual initiative review\nProgramme: habitat restoration\nReporting period: previous financial year\nMilestone: field monitoring completed\nThe communications team published this overview on www.example.com for visitors and partner organizations.','صندوق البيئة — المراجعة السنوية للمبادرة\nالبرنامج: استعادة الموائل الطبيعية\nفترة التقرير: السنة المالية السابقة\nالمرحلة المنجزة: استكمال الرصد الميداني\nنشر فريق الاتصال هذا الموجز على www.example.com للزوار والجهات الشريكة.')],
  'case:old-menu':['Site_Visit_Draft.pdf',text('Earlier site visit schedule\nProject: environmental monitoring\nVisit window: Sunday morning\nA revised schedule replaced this draft after the site team confirmed access times.','مسودة سابقة لجدول الزيارة الميدانية\nالمشروع: الرصد البيئي\nموعد الزيارة: صباح الأحد\nحل جدول محدّث محل هذه المسودة بعد تأكيد الفريق الميداني مواعيد الدخول.')],
  's03:brochure':['Environment_Fund_Overview.pdf',text('Environment Fund — programme overview\nThe website edition introduces environmental initiatives, partner services and programme application dates. Copies are available from www.example.com.','صندوق البيئة — نبذة عن البرامج\nتعرّف نسخة الموقع بالمبادرات البيئية وخدمات الشركاء ومواعيد التقديم على البرامج. تتوفر النسخ على www.example.com.')],
  's03:report':['Environmental_Project_Brief.pdf',text('Quarterly environmental project brief\nProject: site monitoring programme\nMilestone: field measurements received\nNext review: Thursday\nThe planning team is consolidating departmental progress for the quarterly review.','موجز المشروع البيئي للربع الحالي\nالمشروع: برنامج رصد المواقع\nالمرحلة المنجزة: استلام القياسات الميدانية\nالمراجعة القادمة: الخميس\nيجمع فريق التخطيط مستجدات الإدارات استعدادًا للمراجعة ربع السنوية.')]
 };
 for(const row of rows){
  if(documentCopy[row.id]){[row.title,row.description]=documentCopy[row.id];}
  if(/^case:[^:]+:document$/.test(row.id)){
   const owner=row.metadata.owner;
   row.title=`${row.id.split(':')[1]}_Project_Review.pdf`;
   row.description=text(`Environment Fund — project review notes\nPrepared by: ${owner.en}\nWorkstation: ${row.metadata.device}\nReview scope: environmental programme milestones\nThe team reviewed field updates and assigned follow-up work for the next reporting period.`,`صندوق البيئة — ملاحظات مراجعة المشروع\nالإعداد: ${owner.ar}\nجهاز العمل: ${row.metadata.device}\nنطاق المراجعة: مراحل إنجاز البرنامج البيئي\nراجع الفريق المستجدات الميدانية وحدد أعمال المتابعة لفترة التقرير القادمة.`);
  }
 }
 const cover=rows.find(r=>r.id==='case:cover'),payment=rows.find(r=>r.id==='case:export');
 if(cover)cover.description=text('FN-63 — Review routing sheet\nPrepared on WS-09\nCoordinator: Reem\nRecipients: the three staff coordinating this review.\nContents: document reference, workstation and review date.\nDistribution: the review workspace; this sheet is not published on the website.','FN-63 — ورقة تنسيق المراجعة\nجهاز الإعداد: WS-09\nالمنسّقة: ريم\nالمستلمون: الموظفون الثلاثة المنسّقون لهذه المراجعة.\nالمحتوى: مرجع المستند وجهاز الإعداد وتاريخ المراجعة.\nالتداول: مساحة المراجعة؛ لم تُنشر الورقة على الموقع الإلكتروني.');
 if(payment)payment.description=text('FN-63 — Environmental project payment working draft\nSupplier: Horizon Environmental Services (fictional)\nProject: habitat monitoring programme\nProposed payment: SAR 84,000\nBank account ending: 4821\nStatus: pending approval; payment not released.\nPrepared for the assigned payment reviewers.\nThe attached schedule includes supplier banking references and negotiated amounts.','FN-63 — مسودة مدفوعات مشروع بيئي\nالمورد: آفاق للخدمات البيئية (افتراضي)\nالمشروع: برنامج رصد الموائل الطبيعية\nالدفعة المقترحة: 84,000 ريال\nنهاية الحساب البنكي: 4821\nالحالة: بانتظار الاعتماد؛ لم تُصرف الدفعة.\nأُعدّت للمراجعين المكلّفين بالمدفوعات.\nيتضمن الجدول مراجع الحسابات البنكية للموردين والمبالغ المتفق عليها.');
 const notices=[
  [text('Nora','نورة'),text('Review copy available','نسخة المراجعة متاحة'),text('I saved the working copy in the document workspace. Please return your comments there before Thursday. The review reference is in the file header.','حفظت نسخة العمل في مساحة المستندات. يرجى إضافة ملاحظاتكم هناك قبل الخميس. مرجع المراجعة مذكور في ترويسة الملف.')],
  [text('Nawaf','نواف'),text('Environmental monitoring milestone','مرحلة رصد المؤشرات البيئية'),text('The field team will submit this month’s monitoring data on Sunday. Please use project reference ENV-24 when adding the measurements to the review workspace.','سيسلّم الفريق الميداني بيانات الرصد لهذا الشهر يوم الأحد. يرجى استخدام مرجع المشروع ENV-24 عند إضافة القياسات إلى مساحة المراجعة.')],
  [text('Mohammed','محمد'),text('Room 3 reservation','حجز القاعة 3'),text('Room 3 is reserved tomorrow from 11:00 to 11:30 for the planning meeting. The calendar invitation has the updated location.','حُجزت القاعة 3 غدًا من 11:00 إلى 11:30 لاجتماع التخطيط. تتضمن دعوة التقويم الموقع المحدّث.')],
  [text('Khalid','خالد'),text('Operations handover schedule','جدول تسليم الأعمال التشغيلية'),text('The project handover meeting is scheduled for Thursday. The operations team will review site access arrangements and the equipment register before signing the record.','حُدد اجتماع تسليم المشروع يوم الخميس. سيراجع فريق العمليات ترتيبات دخول الموقع وسجل المعدات قبل توقيع المحضر.')],
  [text('Falwah','فلوة'),text('Sustainability initiative review','مراجعة مبادرة الاستدامة'),text('The revised resource-use figures are ready for the initiative review. Please add departmental comments by Tuesday so we can prepare the executive briefing.','أصبحت أرقام استهلاك الموارد المحدّثة جاهزة لمراجعة المبادرة. يرجى إضافة ملاحظات الإدارات قبل الثلاثاء لإعداد موجز الإدارة التنفيذية.')],
  [text('Dana','دانا'),text('Document delivery receipt','إيصال تسليم المستندات'),text('The meeting pack was delivered to reception at 08:30. The receipt is filed with this week’s office deliveries.','سُلّم ملف الاجتماع إلى الاستقبال الساعة 08:30. حُفظ الإيصال مع تسليمات المكتب لهذا الأسبوع.')]
 ];
 const core=new Set((record.caseAssignment?.definition.steps||[]).map(step=>`case:${step.id}`));
 const mail=rows.filter(r=>r.source==='mail');
 for(let i=mail.length;i<6;i++){const row={id:`s03:office-mail-${i}`,source:'mail',type:'mail',timestamp:at(-70+i*7),metadata:{},isIncidentRelevant:false,relatedDecision:null};rows.push(row);mail.push(row);}
 mail.forEach((row,i)=>{
  if(['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination'].includes(row.id))return;
  const [sender,subject,body]=notices[i%notices.length];
  row.metadata.senderName=sender;
  if(!row.metadata.from)row.metadata.from=`${sender.en.toLowerCase()}@example.com`;
  if(!core.has(row.id)&&!['finance:review-mail','finance:sharing-mail','s03:session-mail'].includes(row.id)){row.title=subject;row.description=body;}
  if(row.id==='finance:sharing-mail')row.description=text('A document link for FN-63 was created for review@vendor-copy.example.org. The notification was delivered to this mailbox at the recorded time.','أُنشئ رابط للمستند FN-63 للعنوان review@vendor-copy.example.org. وصل الإشعار إلى هذا البريد في الوقت المسجّل.');
  if(row.id==='finance:review-mail')row.description=notices[0][2];
 });
 let required=rows.filter(r=>r.expectedClassification).slice(0,2);
 if(required.length<2){
  const preferred=['case:directory','case:identity','case:handover','s03:inventory','s03:brochure'];
  for(const id of [...preferred,...rows.filter(r=>['documents','downloads'].includes(r.source)&&r.type!=='protected').map(r=>r.id)]){
   const row=rows.find(r=>r.id===id);if(!row||required.includes(row))continue;
   row.expectedClassification=id==='s03:brochure'?'public':'restricted';
   if(row.expectedClassification==='restricted')row.description=text(`${typeof row.description==='object'?row.description.en:row.description}\nWorking copy for staff coordinating this activity, distributed through the staff workspace.`,`${typeof row.description==='object'?row.description.ar:row.description}\nنسخة عمل للموظفين المنسّقين لهذا النشاط، تُتداول عبر مساحة عمل الموظفين.`);
   required.push(row);if(required.length===2)break;
  }
 }
 if(required.length!==2)throw new Error('Station 03 requires two readable documents');
 for(const row of rows)if(!required.includes(row))delete row.expectedClassification;
 record.station03Experience={version:4,minimumEvidence:Math.max(1,record.caseAssignment?.station03?.minimumEvidence||0),requiredDocumentIds:required.map(r=>r.id),rows:refineStation03Workplace(rows)};
 ensureDataChallenge(record);
 bindNarrativeClue(record);
 bindVaultClues(record);
}

export function publicStation03Experience(record){
 const experience=record.station03Experience;
 if(!experience)return null;
 return {dataChallenge:publicDataChallenge(experience.dataChallenge),version:experience.version,minimumEvidence:experience.minimumEvidence,requiredDocumentIds:experience.requiredDocumentIds,records:experience.rows.map(({expectedClassification,isIncidentRelevant,relatedDecision,...row})=>row)};
}

function ensureDataChallenge(record){
 const station=record.mission.decisions.station03;
 const existing=record.station03Experience.dataChallenge;
 if(existing?.version===2)return;
 if(existing||station?.dataDecisions||station?.dataChallengeScore){
  const archived={
   challenge:existing||null,
   decisions:station?.dataDecisions||null,
   score:station?.dataChallengeScore||null
  };
  if(station){
   station.legacyDataChallenge ||= archived;
   delete station.dataDecisions;
   delete station.dataChallengeScore;
  }else record.legacyStation03DataChallenge ||= archived;
 }
 record.station03Experience.dataChallenge=assignDataChallenge(record.mission.startedAt);
}
