import {text} from '../../shared/casePeople.mjs';

// Only authored templates may be assigned. Reserved cases contain no invented evidence.
export const STATION03_CASES = {
 A:{id:'finance-a',version:1,status:'authored',connectedCaseId:'case-03'},
 B:{id:'legal-b',status:'draft'},
 C:{id:'executive-c',status:'draft'},
 D:{id:'hr-operations-d',status:'draft'}
};
export function financeTemplate(definition){
 const rows=definition.steps.map(step=>({...structuredClone(step),id:`case:${step.id}`,isIncidentRelevant:true}));
 const add=(id,source,title,en,ar,type,minute,metadata={},relevant=false)=>rows.push({id,source,title,description:text(en,ar),type,minute,metadata,isIncidentRelevant:relevant});
 const cover=rows.find(row=>row.id==='case:cover');
 cover.description=text('FN-63 — preparation checklist. Workstation WS-09, Reem, Finance. This routing sheet lists the document reference and preparation device only; it contains no payment amounts or banking details. For staff coordinating the review, not public distribution.','FN-63 — قائمة تجهيز المراجعة. الجهاز WS-09، ريم، المالية. تتضمن ورقة التنسيق مرجع المستند وجهاز إعداده فقط، دون مبالغ مدفوعات أو بيانات بنكية. مخصّصة للموظفين المنسّقين للمراجعة وليست للنشر العام.');
 cover.expectedClassification='restricted';
 const exported=rows.find(row=>row.id==='case:export');
 exported.description=text('FN-63 — draft supplier payments, not released. Fictional supplier Cedar Supplies: proposed payment SAR 84,000; bank account ending 4821. The payment remains under review. Disclosure could expose supplier banking information and enable payment fraud. Saved from the finance portal for the assigned review team; no external sharing approval is recorded.','FN-63 — مسودة مدفوعات موردين لم تُعتمد للنشر. المورد الافتراضي «توريدات الأرز»: دفعة مقترحة بقيمة 84,000 ريال، وحساب بنكي ينتهي بـ 4821. الدفعة قيد المراجعة. قد يكشف الإفصاح بيانات المورد البنكية ويتيح الاحتيال في المدفوعات. حُفظ الملف من بوابة المالية لفريق المراجعة المكلّف، ولا يوجد اعتماد لمشاركته خارجيًا.');
 exported.expectedClassification='secret';
 add('finance:review-mail','mail',text('FN-63: review within the assigned team','FN-63: مراجعة ضمن الفريق المكلّف'),'Please review the draft payment summary in the finance workspace. Keep it within the assigned review team until approval. The routing sheet identifies the workstation used to prepare it.','يرجى مراجعة مسودة ملخص المدفوعات في مساحة المالية. تُتداول داخل فريق المراجعة المكلّف حتى اعتمادها. تحدد ورقة التنسيق الجهاز المستخدم لإعدادها.','mail',-35,{from:'finance-review@example.com',reference:'FN-63'});
 add('finance:sharing-mail','mail',text('FN-63: sharing notification','FN-63: إشعار مشاركة'),'A document link was created for review@vendor-copy.example.org. Reference FN-63. Check the access history for the sharing event.','أُنشئ رابط مستند للعنوان review@vendor-copy.example.org بالمرجع FN-63. يمكن مراجعة حدث المشاركة في سجل الوصول.','mail',-17,{from:'sharing@example.com',reference:'FN-63'});
 add('finance:meeting-mail','mail',text('Team meeting: room update','اجتماع الفريق: تحديث القاعة'),'Tomorrow’s team meeting has moved to room 3. The time is unchanged.','نُقل اجتماع الفريق غدًا إلى القاعة 3. الموعد لم يتغير.','mail',-50,{from:'office@example.com'});
 add('case:directory','documents','Workstation_Directory.pdf','Reem / Finance / WS-09 / reem@example.com\nNora / Operations / WS-27 / nora@example.com\nSami / Employee Services / WS-14 / sami@example.com\nMazen / Planning / WS-31 / mazen@example.com','ريم / المالية / WS-09 / reem@example.com\nنورة / العمليات / WS-27 / nora@example.com\nسامي / خدمات الموظفين / WS-14 / sami@example.com\nمازن / التخطيط / WS-31 / mazen@example.com','pdf',-180,{},true);
 add('finance:public-report','documents','Published_Service_Report.pdf','A published summary of last year’s service achievements. Available to everyone on the organization’s public website; no personal or payment details.','ملخص منشور لإنجازات الخدمات في العام الماضي، متاح للجميع على الموقع العام للجهة. لا يتضمن بيانات شخصية أو تفاصيل مدفوعات.','pdf',-90,{domain:'www.example.com'});
 add('finance:recent-export','activity',text('Payment summary saved','حفظ ملخص المدفوعات'),'Supplier_Payment_Summary.pdf was saved from the finance workspace on WS-09. Reference FN-63.','حُفظ Supplier_Payment_Summary.pdf من مساحة المالية على WS-09، بالمرجع FN-63.','access',-23,{device:'WS-09',reference:'FN-63'});
 add('finance:recent-delete','activity',text('Sharing receipt removed','إزالة إيصال المشاركة'),'Sharing_Receipt.pdf was moved to the Recycle Bin after the sharing event.','نُقل Sharing_Receipt.pdf إلى سلة المحذوفات بعد حدث المشاركة.','access',-12,{device:'WS-09',reference:'FN-63'});
 add('finance:sign-in','logs',text('Work session started','بدء جلسة العمل'),'The assigned account signed in on workstation WS-09. This entry alone does not show who physically used the device.','سجّل الحساب المخصّص الدخول على WS-09. لا يحدّد هذا السجل وحده من استخدم الجهاز فعليًا.','access',-45,{device:'WS-09',account:'reem@example.com'});
 add('finance:keyboard','devices',text('Office keyboard','لوحة مفاتيح المكتب'),'Assigned office equipment.','جهاز مكتبي مخصّص للعمل.','device',-180,{device:'KB-009'});
 return {...STATION03_CASES.A,minimumEvidence:4,rows};
}
export function station03TemplateRecords(record){
 const template=record.caseAssignment?.station03;
 if(!template)return null;
 return template.rows.map(({minute,...row})=>({...row,timestamp:new Date(Date.parse(record.mission.startedAt)+minute*60000).toISOString(),relatedDecision:null}));
}
