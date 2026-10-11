import {text} from '../../shared/casePeople.mjs';
import {renameStation03Files} from '../../shared/station03Filenames.mjs';

const people={nora:text('Nora','نورة'),nawaf:text('Nawaf','نواف'),mohammed:text('Mohammed','محمد'),khalid:text('Khalid','خالد'),sara:text('Sara','سارة'),flwah:text('Falwah','فلوة')};
const correspondence={
 nora:[text('Environmental indicators: review copy','تقرير المؤشرات البيئية للمراجعة'),text('Hello,\n\nThe latest field measurements are in Project_Update.pdf. Please review the site coverage and water-use figures before Thursday’s project meeting. I have left the two outstanding site readings in the notes for follow-up.\n\nThank you,\nNora','السلام عليكم،\n\nأضفت نتائج القياسات الميدانية الأخيرة إلى Project_Update.pdf. يرجى مراجعة نسبة تغطية المواقع وبيانات استهلاك المياه قبل اجتماع المشروع يوم الخميس. أدرجت في الملاحظات قراءتين لم تصلنا من الفريق الميداني بعد للمتابعة.\n\nشكرًا لكم،\nنورة')],
 nawaf:[text('Field services purchase order','طلب شراء الخدمات الميدانية'),text('Hello,\n\nProcurement has received the supplier’s quotation for the next site visit. Please confirm the number of sites and equipment needs before we issue the purchase order. The proposed visit is Sunday morning.\n\nRegards,\nNawaf','السلام عليكم،\n\nاستلمت المشتريات عرض المورد للزيارة الميدانية القادمة. نرجو تأكيد عدد المواقع واحتياجات الأجهزة قبل إصدار أمر الشراء. الموعد المقترح للزيارة صباح الأحد.\n\nتحياتي،\nنواف')],
 mohammed:[text('Thursday meeting — room 3','اجتماع الخميس — القاعة 3'),text('Hello,\n\nRoom 3 is booked for the project review on Thursday, 11:00–11:30. I have updated the calendar invitation. Please send any agenda additions by the end of tomorrow.\n\nThank you,\nMohammed','السلام عليكم،\n\nتم حجز القاعة 3 لمراجعة المشروع يوم الخميس من 11:00 إلى 11:30، وتحديث دعوة الاجتماع في التقويم. يرجى إرسال أي إضافات على جدول الأعمال قبل نهاية يوم غد.\n\nشكرًا،\nمحمد')],
 khalid:[text('Site team handover','تسليم الأعمال للفريق الميداني'),text('Hello,\n\nThe operations team has updated the site access schedule and equipment list. Please confirm your team’s contact details before the next visit so reception can prepare the access list.\n\nRegards,\nKhalid','السلام عليكم،\n\nحدّث فريق العمليات جدول دخول المواقع وقائمة الأجهزة. يرجى تأكيد بيانات التواصل الخاصة بفريقكم قبل الزيارة القادمة لتجهيز قائمة الدخول لدى الاستقبال.\n\nتحياتي،\nخالد')],
 sara:[text('October supplier payment review','مراجعة دفعة المورد لشهر أكتوبر'),text('Hello,\n\nPlease review Payments_Oct.xlsx against invoice 1048 for Horizon Environmental Services. The field survey and reporting amounts total SAR 84,000. We are waiting for approval before sending the payment request.\n\nThank you,\nSara','السلام عليكم،\n\nيرجى مراجعة Payments_Oct.xlsx ومطابقة المبالغ مع الفاتورة 1048 لشركة آفاق للخدمات البيئية. يبلغ إجمالي أعمال المسح الميداني وإعداد التقرير 84,000 ريال. ننتظر الاعتماد قبل إرسال طلب الصرف.\n\nشكرًا لكم،\nسارة')],
 flwah:[text('Sustainability review: departmental comments','ملاحظات الإدارات على تقرير الاستدامة'),text('Hello,\n\nPlease send your comments on resource use and the vegetation rehabilitation activities by Tuesday. We will consolidate the departmental updates into the next project report.\n\nThank you,\nFalwah','السلام عليكم،\n\nنرجو إرسال ملاحظاتكم على بيانات استهلاك الموارد وأعمال تأهيل الغطاء النباتي قبل يوم الثلاثاء. سنجمع تحديثات الإدارات ضمن تقرير المشروع القادم.\n\nشكرًا لتعاونكم،\nفلوة')]
};

// Only authored text/display fields change. IDs, timestamps, relevance and private answers survive.
export function refineStation03Workplace(rows){
 const result=renameStation03Files(rows);
 const mail=result.filter(row=>row.source==='mail');
 const aliases={sami:'nawaf',reem:'sara',mazen:'khalid',falwah:'flwah'};
 const usedPeople=new Set();
 mail.forEach((row,index)=>{
  if(['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination'].includes(row.id))return;
  const special={
   'finance:sharing-mail':[text('A link to Payments_Oct.xlsx was created','إنشاء رابط للملف Payments_Oct.xlsx'),text('A link to Payments_Oct.xlsx has been created for review@vendor-copy.example.org.\n\nYou can manage access from the document’s sharing settings.','تم إنشاء رابط للملف Payments_Oct.xlsx وإتاحته للعنوان review@vendor-copy.example.org.\n\nيمكن إدارة صلاحيات الوصول من إعدادات مشاركة المستند.')],
   'case:message':[text('Your benefits document','مستند المزايا الوظيفية'),text('Hello,\n\nYour benefits document is ready. Please use benefits-review.example.net to download the update package for reference HR-18.\n\nEmployee Services','السلام عليكم،\n\nأصبح مستند المزايا الوظيفية جاهزًا. يرجى الدخول إلى benefits-review.example.net لتنزيل حزمة التحديث الخاصة بالطلب HR-18.\n\nخدمات الموظفين')],
   'case:rule':[text('Mail forwarding settings updated','تحديث إعدادات تحويل البريد'),text('Mail forwarding settings have been updated.\n\nDestination: archive@review-mail.example.net\nMessages: account notifications\nReference: HR-18','تم تحديث إعدادات تحويل البريد.\n\nالوجهة: archive@review-mail.example.net\nالرسائل: إشعارات الحساب\nالمرجع: HR-18')],
   'case:delivery':[text('Project_Sept.zip received','تم استلام Project_Sept.zip'),text('The workspace has received Project_Sept.zip from the planning account.\n\nDelivery reference: PL-85\nThe receipt is available in the delivery history.','استلمت مساحة العمل Project_Sept.zip من حساب التخطيط.\n\nمرجع التسليم: PL-85\nيتوفر الإيصال في سجل التسليمات.')],
   's03:session-mail':[text('Account sign-in notification','إشعار تسجيل دخول للحساب'),text('A sign-in was recorded for your account.\n\nDevice: WS-27\nActivity reference: AUTH-204\nYou can review your sessions in account settings.','تم تسجيل دخول إلى حسابك.\n\nالجهاز: WS-27\nمرجع النشاط: AUTH-204\nيمكنك مراجعة الجلسات من إعدادات الحساب.')]
  }[row.id];
  if(special){[row.title,row.description]=special;return;}
  const account=(row.metadata.from||'').split('@')[0];
  let person=aliases[account]||account;
  if(row.id==='finance:review-mail')person='sara';
  else if(row.id==='finance:meeting-mail')person='mohammed';
  if(!correspondence[person]||usedPeople.has(person))person=['mohammed','flwah','nora','nawaf','sara','khalid'].find(key=>!usedPeople.has(key));
  usedPeople.add(person);
  [row.title,row.description]=correspondence[person];row.metadata.senderName=people[person];
  if(!row.isIncidentRelevant&&!row.id.startsWith('case:')&&!['finance:review-mail','finance:sharing-mail'].includes(row.id)){
   row.metadata.from=`${person}@environment-fund.invalid`;
  }
  row.description={...row.description};
  if(person==='sara'){
   row.description.en+='\n\nI prepared the printed payment documents left on the desk for the Finance review.';
   row.description.ar+='\n\nأعددت مستندات الدفعة المطبوعة الموجودة على المكتب لمراجعة الإدارة المالية.';
  }
  if(!result.some(item=>item.title==='Project_Update.pdf'))for(const lang of ['en','ar'])row.description[lang]=row.description[lang].replaceAll('Project_Update.pdf',result.some(item=>item.title==='Field_Notes.pdf')?'Field_Notes.pdf':'Project_Status.docx');
  if(!result.some(item=>item.title==='Payments_Oct.xlsx'))for(const lang of ['en','ar'])row.description[lang]=row.description[lang].replaceAll('Payments_Oct.xlsx','Invoice_1048.pdf');
 });
 const documents={
  'case:cover':text('Vegetation rehabilitation — October update\nProject lead: Sara\nPrepared on: WS-09\nReview group: Finance and project operations\nThe field team completed the first round of visits. Two site readings remain outstanding. The next review is scheduled for Thursday.\nIndicator | Target | Latest\nSites visited | 12 | 10\nArea assessed (hectares) | 240 | 208\nWater-use reporting | 12 sites | 10 sites\nNext actions: obtain the remaining readings and review the supplier’s October payment before approval.\nCirculation: finance and project operations working folder.','تأهيل الغطاء النباتي — تحديث أكتوبر\nمسؤولة المتابعة: سارة\nجهاز الإعداد: WS-09\nفريق المراجعة: المالية وعمليات المشاريع\nأنهى الفريق الميداني الجولة الأولى من الزيارات، وما زالت قراءات موقعين قيد الاستكمال. حُددت المراجعة القادمة يوم الخميس.\nالمؤشر | المستهدف | المنجز\nالمواقع التي تمت زيارتها | 12 | 10\nالمساحة التي جرى تقييمها بالهكتار | 240 | 208\nتقارير استهلاك المياه | 12 موقعًا | 10 مواقع\nالمتابعة: استكمال القراءات ومراجعة دفعة المورد لشهر أكتوبر قبل الاعتماد.\nالتداول: مجلد عمل المالية وعمليات المشاريع.'),
  'case:export':text('October payment worksheet\nSupplier: Horizon Environmental Services\nProject: vegetation rehabilitation\nInvoice: 1048\nAccount ending: 4821\nStatus: awaiting approval; payment not released\nDescription | Amount (SAR)\nField survey services | 60,000\nAnalysis and reporting | 24,000\nTotal proposed payment | 84,000\nReview note: match the completed work to the site visit records before submitting the payment request.','كشف مدفوعات أكتوبر\nالمورد: آفاق للخدمات البيئية\nالمشروع: تأهيل الغطاء النباتي\nالفاتورة: 1048\nنهاية الحساب البنكي: 4821\nالحالة: بانتظار الاعتماد؛ لم تُصرف الدفعة\nالبند | المبلغ بالريال\nخدمات المسح الميداني | 60,000\nالتحليل وإعداد التقرير | 24,000\nإجمالي الدفعة المقترحة | 84,000\nملاحظة المراجعة: مطابقة الأعمال المنجزة مع سجلات الزيارات قبل إرسال طلب الصرف.'),
  'finance:public-report':text('Environment and Community Forum\nVenue: Environment Fund visitor centre\nAttendance: open registration through www.example.com\nThis agenda is published on the event website and may be shared with visitors.\nTime | Session\n09:00 | Registration\n09:30 | Welcome and programme overview\n10:00 | Vegetation rehabilitation projects\n11:00 | Questions and partner discussions','ملتقى البيئة والمجتمع\nالمكان: مركز زوار صندوق البيئة\nالحضور: التسجيل متاح للجميع عبر www.example.com\nنُشر هذا البرنامج على موقع الملتقى ويمكن مشاركته مع الزوار.\nالوقت | الفقرة\n09:00 | التسجيل\n09:30 | الافتتاح والتعريف بالبرامج\n10:00 | مشاريع تأهيل الغطاء النباتي\n11:00 | الأسئلة والنقاش مع الشركاء'),
  's03:budget':text('Quarterly project budget\nPeriod: Q4\nDepartment: Project Operations\nCost category | Approved (SAR) | Used (SAR)\nField visits | 120,000 | 72,000\nMonitoring equipment | 80,000 | 55,000\nWorkshops | 30,000 | 12,000\nPlease confirm outstanding purchase orders before the next budget review.','ميزانية المشاريع للربع الرابع\nالفترة: الربع الرابع\nالإدارة: عمليات المشاريع\nبند التكلفة | المعتمد بالريال | المستخدم بالريال\nالزيارات الميدانية | 120,000 | 72,000\nأجهزة الرصد | 80,000 | 55,000\nورش العمل | 30,000 | 12,000\nيرجى تأكيد أوامر الشراء القائمة قبل مراجعة الميزانية القادمة.')
 };
 documents['s03:brochure']=documents['finance:public-report'];
 // Keep the existing general project report outside the finance case.
 documents['case:reem:document']=documents['case:export'];
 documents['case:nora:document']=text('Field visit notes\nPrepared by: Nora\nProject: vegetation rehabilitation\nSites visited: 10 of 12\nArea assessed: 208 hectares\nTwo readings remain outstanding. Please request them from the site coordinators before Thursday’s review.','ملاحظات الزيارات الميدانية\nالإعداد: نورة\nالمشروع: تأهيل الغطاء النباتي\nالمواقع التي تمت زيارتها: 10 من 12\nالمساحة التي جرى تقييمها: 208 هكتارات\nما زالت قراءتان قيد الاستكمال. يرجى طلبهما من منسقي المواقع قبل مراجعة الخميس.');
 const activity={
  'case:share':text('File: Payments_Oct.xlsx\nLink recipient: review@vendor-copy.example.org\nAction: sharing link created','الملف: Payments_Oct.xlsx\nمستلم الرابط: review@vendor-copy.example.org\nالإجراء: إنشاء رابط مشاركة'),
  'case:receipt':text('File: Receipt_06.pdf\nOriginal folder: Finance downloads\nRelated document: Payments_Oct.xlsx\nThe receipt was moved to the Recycle Bin.','الملف: Receipt_06.pdf\nالمجلد الأصلي: تنزيلات المالية\nالمستند المرتبط: Payments_Oct.xlsx\nنُقل الإيصال إلى سلة المحذوفات.'),
  'case:identity':text('Operations handover\nTransfer reference: OP-42\nSource workstation: WS-27\nMaterial: site coordination contacts\nThe operations team prepared the contact list for the next round of site visits.','تسليم أعمال العمليات\nمرجع التسليم: OP-42\nجهاز المصدر: WS-27\nالمحتوى: بيانات التواصل لتنسيق المواقع\nأعد فريق العمليات قائمة التواصل للجولة القادمة من الزيارات الميدانية.'),
  'case:handover':text('Project handover record\nReference: PL-85\nPrepared on: WS-31\nProject: vegetation rehabilitation\nHandover scope: visit schedules, equipment register and site team contacts\nNext action: confirm receipt of the project package with the receiving team.','محضر تسليم المشروع\nالمرجع: PL-85\nجهاز الإعداد: WS-31\nالمشروع: تأهيل الغطاء النباتي\nنطاق التسليم: جداول الزيارات وسجل الأجهزة وبيانات التواصل مع الفرق الميدانية\nالمتابعة: تأكيد استلام حزمة المشروع مع الفريق المستلم.')
 };
 const directory=result.find(row=>row.id==='case:directory');
 const accounts=new Map((directory?.description.en||'').split('\n').map(line=>line.split(' / ')).filter(cells=>cells.length===4).map(cells=>[cells[2],cells[3]]));
 for(const row of result){
  if(documents[row.id])row.description=documents[row.id];
  if(activity[row.id])row.description=activity[row.id];
  if(!row.metadata.account&&accounts.has(row.metadata.device))row.metadata.account=accounts.get(row.metadata.device);
  if(typeof row.title==='string'&&row.title.endsWith('.xlsx'))row.type='spreadsheet';
  if(typeof row.title==='string'&&row.title.endsWith('.docx'))row.type='document';
 }
 return result;
}
