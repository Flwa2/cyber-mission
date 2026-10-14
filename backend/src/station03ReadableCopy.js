import {text} from '../../shared/casePeople.mjs';

const computers={
 'WS-27':text('Site coordination computer','جهاز تنسيق المواقع'),
 'WS-14':text('Employee services computer','جهاز خدمات الموظفين'),
 'WS-09':text('Payment review computer','جهاز مراجعة المدفوعات'),
 'WS-31':text('Project review computer','جهاز مراجعة المشروع'),
 'OTHER-02':text('Another computer','جهاز آخر'),
 'USB-NEW-01':text('USB drive connected at the desk','وحدة USB موصولة بالمكتب'),
 'PER-NEW-01':text('Accessory connected at the desk','ملحق موصول بالمكتب')
};
const accounts={
 'WS-27':text('Site coordination account','حساب تنسيق المواقع'),
 'WS-14':text('Employee services account','حساب خدمات الموظفين'),
 'WS-09':text('Payment review account','حساب مراجعة المدفوعات'),
 'WS-31':text('Project review account','حساب مراجعة المشروع')
};
const destinations={
 'planning.example.com':text('the internal planning folder','مجلد التخطيط الداخلي'),
 'operations.example.com':text('the internal operations folder','مجلد العمليات الداخلي'),
 'finance.example.com':text('the internal finance folder','مجلد المالية الداخلي'),
 'project-drop.example.org':text('a project-sharing service outside the organization','خدمة مشاركة مشاريع خارج الجهة'),
 'share-files.example.net':text('a file-sharing service outside the organization','خدمة مشاركة ملفات خارج الجهة'),
 'review@vendor-copy.example.org':text('a recipient outside the organization','مستلم خارج الجهة'),
 'archive@review-mail.example.net':text('an email address outside the organization','عنوان بريد خارج الجهة'),
 'benefits-review.example.net':text('the benefits website linked in the message','موقع المزايا المشار إليه في الرسالة'),
 'learning.example.com':text('the staff training portal','بوابة تدريب الموظفين')
};
const transfers={
 'OP-42':'Site_Contacts.pdf','HR-18':'Update.zip','FN-63':'Payments_Oct.xlsx','PL-85':'Project_Sept.zip'
};

// Presentation copy for newly authored snapshots only. Technical metadata and
// evidence keys remain unchanged; this is not a migration of saved missions.
export function simplifyInvestigationCopy(rows,mapped){
 const personAccounts=new Map(mapped.map(p=>[`${p.person.id}@example.com`,accounts[p.device]]));
 function simplify(value,lang){
  if(typeof value!=='string')return value;
  let result=value;
  for(const [code,label] of Object.entries(computers))result=result.replaceAll(code,label[lang]);
  for(const [address,label] of personAccounts)result=result.replaceAll(address,label[lang]);
  for(const [address,label] of Object.entries(destinations))result=result.replaceAll(address,label[lang]);
  // Drop redundant reference fields; filenames and times still connect events.
  result=result.split('\n').filter(line=>! /^(Reference|Transfer|Delivery reference|Activity reference|المرجع|النقل|مرجع التسليم|مرجع النشاط):/.test(line)).join('\n');
  for(const [code,filename] of Object.entries(transfers))result=result.replaceAll(code,filename);
  return result;
 }
 const displayValue=value=>typeof value==='string'?text(simplify(value,'en'),simplify(value,'ar')):value;
 for(const row of rows){
  // Keep actual sender addresses: names are displayed alongside them, and
  // changing a sender address would create false email evidence.
  if(row.description?.en)row.description=text(simplify(row.description.en,'en'),simplify(row.description.ar,'ar'));
  const visible={};
  for(const [key,value] of Object.entries(row.metadata)){
   if(['identityVersion','reference','event','readablePresentation'].includes(key))continue;
   if(key==='account')visible[key]=personAccounts.get(value)||displayValue(value);
   else if(key==='device')visible[key]=computers[value]||(/^KB-/.test(value)?text('Office keyboard','لوحة مفاتيح المكتب'):/^HS-/.test(value)?text('Meeting headset','سماعة الاجتماعات'):displayValue(value));
   else if(key==='domain'||key==='url')visible[key]=destinations[value]||displayValue(value);
   else visible[key]=value;
  }
  row.metadata.readablePresentation={version:1,metadata:visible};
 }
 const directory=rows.find(r=>r.id==='case:directory');
 if(directory)directory.description=text(
  'Review team contacts\nName / Department / Assigned computer / Work account\n'+mapped.map(p=>`${p.person.name.en} / ${p.person.role.en} / ${computers[p.device].en} / ${accounts[p.device].en} (${p.person.id}@example.com)`).join('\n'),
  'جهات التواصل لفريق المراجعة\nالاسم / القسم / الجهاز المخصص / حساب العمل\n'+mapped.map(p=>`${p.person.name.ar} / ${p.person.role.ar} / ${computers[p.device].ar} / ${accounts[p.device].ar} (${p.person.id}@example.com)`).join('\n')
 );
 // Titles only: source labels and copy/computer qualifiers; IDs and relevance are untouched.
 const retitle=(id,en,ar)=>{const row=rows.find(r=>r.id===id);if(row)row.title=text(en,ar);};
 for(const row of rows){
  const computer=computers[row.metadata?.device];
  if(/:signin$|^finance:sign-in$/.test(row.id)&&computer)row.title=text(`Work session started — ${computer.en}`,`بدء جلسة العمل — ${computer.ar}`);
  if(row.source==='mail'&&row.title?.en==='Invoice 1048 — revised copy')row.title=text('Email: Invoice 1048 revised copy','بريد: نسخة معدلة من الفاتورة 1048');
 }
 if(rows.some(r=>r.id==='case:identity')){
  if(rows.find(r=>r.id==='case:file')?.title==='Site_Contacts.pdf')retitle('case:file','Site_Contacts.pdf (downloaded copy)','Site_Contacts.pdf (نسخة منزّلة)');
  if(rows.find(r=>r.id==='case:deleted')?.title==='Site_Contacts.pdf')retitle('case:deleted','Site_Contacts.pdf (deleted copy)','Site_Contacts.pdf (نسخة محذوفة)');
 }
 if(rows.some(r=>r.id==='finance:sharing-mail')){
  retitle('case:share','Activity log: external sharing link created','سجل النشاط: إنشاء رابط مشاركة خارجي');
  retitle('finance:sharing-mail','Notification: sharing link for Payments_Oct.xlsx','إشعار: رابط مشاركة للملف Payments_Oct.xlsx');
  retitle('finance:recent-delete','Recent activity: Receipt_06.pdf moved to Recycle Bin','النشاط الأخير: نقل Receipt_06.pdf إلى سلة المحذوفات');
  retitle('finance:recent-export','Recent activity: Payments_Oct.xlsx saved','النشاط الأخير: حفظ Payments_Oct.xlsx');
  const exportRow=rows.find(r=>r.id==='finance:recent-export');
  if(exportRow?.description?.en)exportRow.description=text(exportRow.description.en.replace(/ Reference Payments_Oct\.xlsx\./,''),exportRow.description.ar.replace(/، بالمرجع Payments_Oct\.xlsx/,''));
 }
 const delivery=rows.find(r=>r.id==='case:delivery');
 if(delivery?.title?.en==='Project_Sept.zip received')delivery.title=text('Delivery notice: Project_Sept.zip received','إشعار تسليم: تم استلام Project_Sept.zip');
 const rewrite=(id,en,ar)=>{const row=rows.find(r=>r.id===id);if(row)row.description=text(en,ar);};
 rewrite('case:upload',
  'A copy of Project_Sept.zip was shared outside the organization from the project review computer. The receiving service was separate from the internal planning folder.',
  'تمت مشاركة نسخة من Project_Sept.zip خارج الجهة من جهاز مراجعة المشروع. خدمة الاستلام منفصلة عن مجلد التخطيط الداخلي.');
 rewrite('case:activity',
  rows.some(r=>r.id==='case:identity')?'Site_Contacts.pdf was shared outside the organization from the site coordination computer. The receiving service was separate from the internal operations folder.':'The employee services account was used to sign in from another computer. That computer is not listed among the account’s assigned work devices.',
  rows.some(r=>r.id==='case:identity')?'تمت مشاركة Site_Contacts.pdf خارج الجهة من جهاز تنسيق المواقع. خدمة الاستلام منفصلة عن مجلد العمليات الداخلي.':'استُخدم حساب خدمات الموظفين لتسجيل الدخول من جهاز آخر غير مدرج ضمن أجهزة العمل المخصصة للحساب.');
 rewrite('case:delivery',
  'Delivery receipt\nFile: Project_Sept.zip\nReceived by: a project-sharing service outside the organization\nSent from: the project review computer',
  'إيصال تسليم\nالملف: Project_Sept.zip\nالجهة المستلمة: خدمة مشاركة مشاريع خارج الجهة\nأُرسل من: جهاز مراجعة المشروع');
 rewrite('case:message',
  'Hello,\n\nYour benefits document is ready. Use the link in this message to download Update.zip.\n\nEmployee Services',
  'السلام عليكم،\n\nأصبح مستند المزايا الوظيفية جاهزًا. استخدم الرابط الوارد في هذه الرسالة لتنزيل Update.zip.\n\nخدمات الموظفين');
 rewrite('case:rule',
  'Email settings updated\nAccount: employee services\nAccount notifications will now be forwarded to an email address outside the organization.',
  'تحديث إعدادات البريد\nالحساب: خدمات الموظفين\nستُعاد توجيه إشعارات الحساب إلى عنوان بريد خارج الجهة.');
}
