import {PEOPLE,text} from '../../shared/casePeople.mjs';
import {narrativeClue} from '../../shared/narrativeAssignment.mjs';
import {simplifyInvestigationCopy} from './station03ReadableCopy.js';

// Authored display content only. Never change IDs, relevance, timestamps, answers,
// selected evidence or the saved suspect assignment. Applied once to a new snapshot.
export function refineIncidentStory(record){
 const {rows}=record.station03Experience,assignment=record.mission.narrativeAssignment;
 const definition=record.caseAssignment?.definition;
 if(!definition)return;
 const primary=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 const others=assignment.choices.filter(p=>p.id!==primary.id);
 const office={id:'office',name:text('Office Coordination','تنسيق المكاتب'),role:text('Administration','الشؤون الإدارية')};
 const remaining=[...others,office];
 const mapped=PEOPLE.map(p=>({...p,person:p.id===definition.personId?primary:remaining.shift()}));
 const account=p=>`${p.id}@example.com`;
 const owner=mapped.find(p=>p.id===definition.personId);
 const file=({ 'case-01':'Site_Contacts.pdf','case-02':'Update.zip','case-03':'Payments_Oct.xlsx','case-04':'Project_Sept.zip'})[definition.id];
 const reference=definition.reference;
 const row=id=>rows.find(r=>r.id===id);
 const set=(id,title,description,metadata={})=>{const r=row(id);if(r)Object.assign(r,{...(title?{title}:{}),description,metadata:{...r.metadata,...metadata}});};
 const authoredMailIds=new Set(['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination']);

 // The legacy presentation aliases must not rename a randomized Reem to Sara.
 // Simultaneous replacements also avoid cascading one employee into another.
 const aliases={nora:['Nora','نورة'],sami:['Nawaf','نواف'],reem:['Sara','سارة'],mazen:['Khalid','خالد']};
 const replacements=new Map();
 for(const entry of mapped){
  const [en,ar]=aliases[entry.id],p=entry.person;
  for(const [from,to] of [[entry.account,account(p)],[`${en.toLowerCase()}@example.com`,account(p)],[entry.name.en,p.name.en],[entry.name.ar,p.name.ar],[en,p.name.en],[ar,p.name.ar]])replacements.set(from,to);
 }
 const pattern=new RegExp([...replacements.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 const localize=value=>typeof value==='string'?value.replace(pattern,match=>replacements.get(match)):Array.isArray(value)?value.map(localize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,localize(v)])):value;
 for(const r of rows){
  r.title=localize(r.title);r.description=localize(r.description);r.metadata={...localize(r.metadata),identityVersion:2};
 }
 set('case:directory',null,text(
  'Review workspace contacts\n'+mapped.map(p=>`${p.person.name.en} / ${p.person.role.en} / ${p.device} / ${account(p.person)}`).join('\n')+'\nWorkstations may be used for cross-department reviews. The account in each activity record identifies the session used.',
  'جهات التواصل لمساحة المراجعة\n'+mapped.map(p=>`${p.person.name.ar} / ${p.person.role.ar} / ${p.device} / ${account(p.person)}`).join('\n')+'\nتُستخدم الأجهزة أيضًا للمراجعات المشتركة بين الإدارات. يبيّن الحساب في كل سجل نشاط الجلسة المستخدمة.'
 ));
 for(const step of definition.steps){
  const r=row(`case:${step.id}`);if(r)r.metadata.account=account(primary);
 }
 // Keep the employee's ordinary request separate from the later technical record.
 const mail=row('finance:review-mail')||row(`case:${definition.personId}:mail`);
 if(mail)Object.assign(mail,narrativeClue(assignment),{metadata:{...mail.metadata,...narrativeClue(assignment).metadata}});
 const ordinary=rows.filter(r=>r.source==='mail'&&r!==mail&&!authoredMailIds.has(r.id)&&!definition.steps.some(s=>`case:${s.id}`===r.id)&&!['finance:sharing-mail','s03:session-mail'].includes(r.id));
 const letters=[
  [others[0],text('Invoice 1048 — revised copy','الفاتورة 1048 — النسخة المعدلة'),text(
   'Hello,\n\nThe supplier has resent invoice 1048 without changing the total of SAR 84,000. I put the replacement copy in the review folder and asked for the old draft to be removed. Please use the approved supplier address for any reply; I only need confirmation of the line items.\n\nRegards,',
   'السلام عليكم،\n\nأعاد المورد إرسال الفاتورة 1048 دون تغيير الإجمالي البالغ 84,000 ريال. وضعت النسخة البديلة في مجلد المراجعة وطلبت حذف المسودة القديمة. يرجى استخدام عنوان المورد المعتمد عند الرد؛ أحتاج فقط إلى تأكيد البنود.\n\nتحياتي،')],
  [others[1],text('Project pack — meeting copy','ملف المشروع — نسخة الاجتماع'),text(
   'Hello,\n\nI need the project pack for the meeting. Please keep it in the internal team folder rather than sending another attachment. I will collect the printed agenda from the desk before the meeting. The invitation still shows room 3.\n\nThank you,',
   'السلام عليكم،\n\nأحتاج إلى ملف المشروع للاجتماع. يرجى إبقاؤه في مجلد الفريق الداخلي بدلًا من إرسال مرفق آخر. سأستلم جدول الأعمال المطبوع من المكتب قبل الاجتماع. ما زالت الدعوة تشير إلى القاعة 3.\n\nشكرًا،')],
  [office,text('Room 3 — booking confirmed','القاعة 3 — تأكيد الحجز'),text(
   'Hello,\n\nRoom 3 is reserved for Thursday, 11:00–11:30. The facilities team has checked the display cable. Please return the visitor badge to reception after the meeting.\n\nThank you,',
   'السلام عليكم،\n\nحُجزت القاعة 3 يوم الخميس من 11:00 إلى 11:30. فحص فريق المرافق كابل الشاشة. يرجى إعادة بطاقة الزائر إلى الاستقبال بعد الاجتماع.\n\nشكرًا،')],
  [office,text('Site readings for the review','قراءات المواقع للمراجعة'),text(
   'Hello,\n\nThe field team has submitted readings for ten of the twelve sites, covering 208 hectares. The remaining two readings will follow after access is arranged. Please leave those cells blank in the review copy for now.\n\nThank you,',
   'السلام عليكم،\n\nأرسل الفريق الميداني قراءات عشرة مواقع من أصل اثني عشر، بمساحة إجمالية قدرها 208 هكتارات. ستصل القراءتان المتبقيتان بعد تنسيق الدخول إلى الموقعين. يرجى ترك الخانتين فارغتين في نسخة المراجعة حاليًا.\n\nشكرًا،')]
 ];
 ordinary.forEach((r,i)=>{const [p,title,body]=letters[i%letters.length];r.title=title;r.description=text(`${body.en}\n${p.name.en}`,`${body.ar}\n${p.name.ar}`);r.metadata={...r.metadata,from:account(p),senderName:p.name};});
 for(const r of rows.filter(r=>r.source==='mail'&&r!==mail&&!ordinary.includes(r)&&!authoredMailIds.has(r.id))){
  r.metadata.senderName=r.metadata.from==='sharing@example.com'?text('Document Services','خدمات المستندات'):r.metadata.from==='mail-settings@example.com'?text('Mail Services','خدمات البريد'):text('Notifications','الإشعارات');
 }
 const invoice=rows.find(r=>r.title==='Invoice_1048.pdf');
 if(invoice)invoice.description=text(
  'Horizon Environmental Services\nInvoice 1048 — revised copy\nField survey services: SAR 60,000\nAnalysis and reporting: SAR 24,000\nTotal: SAR 84,000\nThe replacement corrects the service description; quantities and amounts are unchanged.\nPayment status: awaiting review. Correspondence remains through the supplier address registered in the procurement portal.',
  'آفاق للخدمات البيئية\nالفاتورة 1048 — نسخة معدلة\nخدمات المسح الميداني: 60,000 ريال\nالتحليل وإعداد التقرير: 24,000 ريال\nالإجمالي: 84,000 ريال\nتُصحح النسخة البديلة وصف الخدمة دون تغيير الكميات أو المبالغ.\nحالة الصرف: بانتظار المراجعة. تُرسل المراسلات عبر عنوان المورد المسجل في بوابة المشتريات.'
 );
 const procurement=rows.find(r=>r.title==='Procurement.pdf');
 if(procurement)procurement.description=text(
  'Purchase request — field services\nSupplier: Horizon Environmental Services\nScope: site survey and final report\nEstimated amount: SAR 84,000\nInvoice reference: 1048\nThe supplier corrected the service description in the replacement invoice. The purchasing team is waiting for confirmation of completed work before issuing the payment request. Equipment purchases are not included in this request.',
  'طلب شراء — خدمات ميدانية\nالمورد: آفاق للخدمات البيئية\nالنطاق: مسح المواقع والتقرير النهائي\nالمبلغ التقديري: 84,000 ريال\nمرجع الفاتورة: 1048\nصحح المورد وصف الخدمة في الفاتورة البديلة. ينتظر فريق المشتريات تأكيد الأعمال المنجزة قبل إصدار طلب الصرف. لا يشمل هذا الطلب شراء أجهزة.'
 );
 const update=rows.find(r=>r.title==='Q3_Update.pdf');
 if(update)update.description=text(
  'September operations update\nCompleted: equipment register updated; meeting pack assembled\nPending: two site readings and confirmation of the supplier invoice items\nNext review: Thursday, room 3\nThe meeting pack includes visit schedules and work contact details. Comments are being consolidated in the internal team folder. The printed agenda will be collected from the desk before the meeting.',
  'تحديث العمليات لشهر سبتمبر\nالمنجز: تحديث سجل الأجهزة وتجهيز ملف الاجتماع\nقيد المتابعة: قراءتان من المواقع وتأكيد بنود فاتورة المورد\nالمراجعة القادمة: الخميس، القاعة 3\nيتضمن ملف الاجتماع جداول الزيارات وبيانات التواصل الوظيفية. تُجمع الملاحظات في مجلد الفريق الداخلي. سيُستلم جدول الأعمال المطبوع من المكتب قبل الاجتماع.'
 );
 // Documents and activity refer to the same existing case reference and file.
 set('case:identity',null,text(`Site coordination handover\nTransfer: ${reference}\nWorkstation: ${owner.device}\nFile: ${file}\nThe list contains staff work contacts for the next site visits. The meeting pack uses the internal operations copy.`,`تسليم أعمال تنسيق المواقع\nالنقل: ${reference}\nالجهاز: ${owner.device}\nالملف: ${file}\nتتضمن القائمة بيانات التواصل الوظيفية للزيارات القادمة. يستخدم ملف الاجتماع نسخة بوابة العمليات الداخلية.`));
 set('case:handover',null,text(`September project handover\nTransfer: ${reference}\nWorkstation: ${owner.device}\nPackage: ${file}\nContents: visit schedules, equipment register and site contacts.\nDelivery route: internal planning workspace.`,`تسليم المشروع لشهر سبتمبر\nالنقل: ${reference}\nالجهاز: ${owner.device}\nالحزمة: ${file}\nالمحتويات: جداول الزيارات وسجل الأجهزة وبيانات التواصل مع المواقع.\nمسار التسليم: مساحة التخطيط الداخلية.`));
 set('case:delivery',null,text(`Delivery receipt\nPackage: ${file}\nTransfer: ${reference}\nReceived by: project-drop.example.org\nSender account: ${account(primary)}`,`إيصال تسليم\nالحزمة: ${file}\nالنقل: ${reference}\nالجهة المستلمة: project-drop.example.org\nحساب المرسل: ${account(primary)}`));
 set('case:cover',null,text(`October review pack\nPrepared by: ${primary.name.en}\nWorkstation: ${owner.device}\nReference: ${reference}\nWorking files: Payments_Oct.xlsx and Invoice_1048.pdf\nSites reviewed: 10 of 12; area assessed: 208 hectares.\nTwo readings are pending. The proposed supplier payment is still awaiting approval.`,`ملف مراجعة أكتوبر\nالإعداد: ${primary.name.ar}\nالجهاز: ${owner.device}\nالمرجع: ${reference}\nملفات العمل: Payments_Oct.xlsx وInvoice_1048.pdf\nالمواقع التي روجعت: 10 من 12؛ المساحة: 208 هكتارات.\nقراءتان قيد الاستكمال. ما زالت دفعة المورد المقترحة بانتظار الاعتماد.`));
 // Finance template has no separate invoice row: name the invoice number, not a missing file.
 if(row('case:cover')&&!rows.some(r=>r.title==='Invoice_1048.pdf')){
  row('case:cover').description.en=row('case:cover').description.en.replace(' and Invoice_1048.pdf',' (invoice 1048)');
  row('case:cover').description.ar=row('case:cover').description.ar.replace(' وInvoice_1048.pdf',' (الفاتورة 1048)');
 }
 for(const id of ['case:share','finance:sharing-mail'])set(id,null,text(`File: ${file}\nReference: ${reference}\nRecipient: review@vendor-copy.example.org\nAction: sharing link created`,`الملف: ${file}\nالمرجع: ${reference}\nالمستلم: review@vendor-copy.example.org\nالإجراء: إنشاء رابط مشاركة`),{account:account(primary)});
 set('case:receipt',null,text(`Sharing receipt\nFile: ${file}\nReference: ${reference}\nRecipient: review@vendor-copy.example.org\nOriginal folder: Finance downloads\nMoved to the Recycle Bin.`,`إيصال مشاركة\nالملف: ${file}\nالمرجع: ${reference}\nالمستلم: review@vendor-copy.example.org\nالمجلد الأصلي: تنزيلات المالية\nنُقل إلى سلة المحذوفات.`));
 // Preserve original times; plain sign-ins and draft deletion are not proof of sharing.
 for(const entry of mapped){
  set(`case:${entry.id}:signin`,text('Work session started','بدء جلسة العمل'),text(`Work account signed in on ${entry.device}.`,`سجّل حساب العمل الدخول على ${entry.device}.`),{device:entry.device,account:account(entry.person)});
 }
 set('finance:sign-in',null,text(`Work account signed in on ${owner.device}.`,`سجّل حساب العمل الدخول على ${owner.device}.`),{account:account(primary)});
 // Station 04 previews show saved descriptions, not the full metadata table.
 // Include the existing record fields in the saved log text, not extra evidence.
 for(const r of rows.filter(r=>['logs','activity'].includes(r.source))){
  for(const [key,en,ar] of [['account','Account','الحساب'],['device','Device','الجهاز']]){
   const value=r.metadata[key];
   if(value)for(const [lang,label] of [['en',en],['ar',ar]])if(!r.description[lang].includes(value))r.description[lang]+=`\n${label}: ${value}`;
  }
 }
 simplifyInvestigationCopy(rows,mapped);
 record.station03Experience.storyVersion=3;
}
