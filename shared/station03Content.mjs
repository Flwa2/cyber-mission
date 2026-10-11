// Stable, fictional workstation records. Conditions use recorded actions, never guessed outcomes.
const text = (en, ar) => ({ en, ar });
export const INVESTIGATION_APPS = [
  ['mail', text('Mail','البريد الإلكتروني')], ['documents',text('Documents','المستندات')],
  ['downloads',text('Downloads','التنزيلات')], ['devices',text('Devices','الأجهزة')],
  ['logs',text('Access Logs','سجلات الوصول')], ['bin',text('Recycle Bin','سلة المحذوفات')]
];
export function buildInvestigation(mission) {
  const start = Date.parse(mission.startedAt || mission.createdAt);
  const time = minutes => new Date((Number.isFinite(start) ? start : 0) + minutes * 60000).toISOString();
  const records = [];
  function add(id,source,title,description,type,minutes,metadata={},relevant=false,relatedDecision=null, timestamp=null,evidenceEligible=true) {
    records.push({id:`s03:${id}`,source,title,description,type,timestamp:timestamp||time(minutes),metadata,isIncidentRelevant:relevant,relatedDecision,evidenceEligible});
  }
  add('meeting','mail',text('Team meeting reminder','تذكير باجتماع الفريق'),text('The weekly team meeting is at 11:00. The invitation is on the team calendar.','اجتماع الفريق الأسبوعي الساعة 11:00. الدعوة متاحة في تقويم الفريق.'),'mail',-95,{from:'team@environment-fund.invalid'});
  add('maintenance','mail',text('IT maintenance notice','إشعار صيانة تقنية المعلومات'),text('Printing services will be unavailable tonight from 20:00 to 20:30. No action is required.','لن تتوفر خدمات الطباعة الليلة من 20:00 إلى 20:30. لا يلزم اتخاذ أي إجراء.'),'mail',-85,{from:'it@environment-fund.invalid'});
  add('newsletter','mail',text('Monthly newsletter','النشرة الشهرية'),text('This month: employee activities and updates to the cafeteria opening hours.','هذا الشهر: أنشطة الموظفين وتحديث أوقات عمل الكافتيريا.'),'mail',-70,{from:'news@environment-fund.invalid'});
  add('stc-account-update','mail',text('Important: Update your STC account details','هام: حدّث بيانات حسابك لدى stc'),
    text('Dear Customer,\n\nTo avoid an interruption to your mobile service, please confirm that your account details are up to date today. The update should only take a moment.\n\nThank you,\nSTC Customer Care','عميلنا العزيز،\n\nلتجنب انقطاع خدمة الجوال، يرجى التأكد اليوم من تحديث بيانات حسابك. لن يستغرق التحديث سوى لحظات.\n\nشكرًا لك،\nخدمة عملاء stc'),
    'mail',-25,{
      from:'support@stc-account-update.invalid',
      senderName:text('STC Customer Care','خدمة عملاء stc'),
      brandMark:'stc',
      buttonText:text('Update account details','تحديث بيانات الحساب'),
      linkText:text('Continue to account update','متابعة تحديث الحساب'),
      url:'https://account-stc-update.invalid/profile'
    },false,null,null,false);
  add('alrajhi-verification','mail',text('New sign-in: Please verify your account','تسجيل دخول جديد: يرجى التحقق من حسابك'),
    text('Dear Customer,\n\nWe noticed a sign-in to your account from a device we have not seen before. If this was you, you can review the activity using the button below. If not, please verify your account within 24 hours.\n\nAl Rajhi Bank','عميلنا العزيز،\n\nرصدنا تسجيل دخول إلى حسابك من جهاز لم نعتده من قبل. إذا كنت أنت، يمكنك مراجعة النشاط عبر الزر أدناه. وإذا لم تكن أنت، يرجى التحقق من حسابك خلال 24 ساعة.\n\nمصرف الراجحي'),
    'mail',-18,{
      from:'security@alrajhi-account-check.invalid',
      senderName:text('Al Rajhi Bank','مصرف الراجحي'),
      brandMark:'RJ',
      buttonText:text('Verify account activity','التحقق من نشاط الحساب'),
      linkText:text('Review recent sign-in','مراجعة تسجيل الدخول الأخير'),
      url:'https://alrajhi-verify.invalid/activity'
    },false,null,null,false);
  add('workplace-coordination','mail',text('Programme information for partner briefing','معلومات البرنامج لإحاطة الجهة الشريكة'),
    text('Hello,\n\nThe partner-relations team is preparing next week’s programme briefing. The latest overview is ready in the shared workspace; please reply if anything needs updating before it is circulated.\n\nBest,\nWorkplace Services','مرحبًا،\n\nيجهّز فريق علاقات الشركاء إحاطة البرنامج للأسبوع القادم. النسخة المحدّثة من الموجز جاهزة في مساحة العمل المشتركة؛ يرجى الرد إذا كان هناك ما يحتاج إلى تحديث قبل تعميمها.\n\nمع التحية،\nخدمات بيئة العمل'),
    'mail',-42,{
      from:'workplace.services@environment-fund.invalid',
      senderName:text('Workplace Services','خدمات بيئة العمل'),
      brandMark:'W'
    },false,null,null,false);
  // Baseline incident predates the participant's actions. These records share an event ID.
  add('session','logs',text('Sign-in recorded','تسجيل دخول'),text('The account session used a device identifier not present in the workstation inventory. This record does not identify who used it.','استخدمت جلسة الحساب معرّف جهاز غير موجود في سجل أجهزة محطة العمل. لا يحدّد هذا السجل هوية المستخدم.'),'access',-12,{device:'WS-27',event:'AUTH-204',account:'employee@example.com'},true);
  add('session-mail','mail',text('New sign-in detected','تم رصد تسجيل دخول جديد'),text('A session was recorded for your account. Device WS-27, event AUTH-204. Review the access history if you do not recognize this activity.','تم تسجيل جلسة لحسابك من الجهاز WS-27، الحدث AUTH-204. راجع سجل الوصول إذا لم تتعرف على هذا النشاط.'),'mail',-11,{from:'identity@example.com',device:'WS-27',event:'AUTH-204'},true);
  add('usual-session','logs',text('Successful sign-in','تسجيل دخول ناجح'),text('Session established from the assigned corporate workstation.','تم إنشاء الجلسة من جهاز العمل المخصّص للموظف.'),'access',-110,{device:'EF-WS-014',account:'employee@example.com'});
  add('print','logs',text('Print service access','الوصول إلى خدمة الطباعة'),text('Quarterly_Report_Q3.pdf was sent to the floor printer.','تم إرسال الملف Quarterly_Report_Q3.pdf إلى طابعة الطابق.'),'access',-48,{device:'EF-WS-014',service:'PRINT-02'});
  add('report','documents','Quarterly_Report_Q3.pdf',text('A quarterly summary of departmental project milestones. No account or payment instructions are included.','ملخص ربع سنوي لمراحل إنجاز مشروعات الإدارة. لا يتضمن تعليمات للحسابات أو المدفوعات.'),'pdf',-60,{owner:'Planning'});
  add('notes','documents','Team_Meeting_Notes.docx',text('Agenda: project updates, resource planning, and next week’s meeting date.','جدول الأعمال: مستجدات المشروعات وتخطيط الموارد وموعد اجتماع الأسبوع القادم.'),'document',-56);
  add('payroll','documents','Employee_Payroll_2026.xlsx',text('Protected document. Contents are unavailable in this workstation session.','مستند محمي. محتوياته غير متاحة في جلسة العمل الحالية.'),'protected',-180,{access:'Restricted'});
  add('budget','documents','Department_Budget.xlsx',text('Approved operating budget totals for the current quarter.','إجمالي الميزانية التشغيلية المعتمدة للربع الحالي.'),'spreadsheet',-125);
  add('inventory','documents','Workstation_Assignment.pdf',text('Assigned workstation: EF-WS-014. The equipment register lists keyboard KB-014 and headset HS-014.','محطة العمل المخصّصة: EF-WS-014. يدرج سجل الأجهزة لوحة المفاتيح KB-014 والسماعة HS-014.'),'pdf',-190,{device:'EF-WS-014'},true);
  add('brochure','downloads','Company_Brochure.pdf',text('A public brochure describing the organization’s services.','كتيّب عام يعرّف بخدمات الجهة.'),'pdf',-65,{domain:'www.example.com'});
  add('calendar','downloads','Workshop_Schedule.pdf',text('Dates and room assignments for next month’s internal workshops.','مواعيد ورش العمل الداخلية للشهر القادم والقاعات المخصّصة لها.'),'pdf',-45,{domain:'events.example.org'});
  add('session-export','downloads','Account_Session_Export.csv',text('An automated account-history export includes event AUTH-204, device WS-27.','يتضمن تصدير تلقائي لسجل الحساب الحدث AUTH-204 والجهاز WS-27.'),'document',-10,{domain:'identity.example.com',event:'AUTH-204'},true);
  add('keyboard','devices',text('Corporate keyboard','لوحة مفاتيح العمل'),text('Assigned input device. Present in the workstation inventory.','جهاز إدخال مخصّص للعمل وموجود في سجل الأجهزة.'),'device',-240,{device:'KB-014',firstSeen:'2025-11-02'});
  add('headset','devices',text('Office headset','سماعة المكتب'),text('Assigned audio device used for meetings.','جهاز صوت مخصّص للاجتماعات.'),'device',-200,{device:'HS-014',firstSeen:'2026-02-10'});
  add('draft','bin','Meeting_Notes_Draft.docx',text('An earlier draft of the team meeting notes.','مسودة سابقة لمحضر اجتماع الفريق.'),'deleted',-35);
  add('image','bin','Cafeteria_Menu.png',text('Last month’s cafeteria menu.','قائمة الكافتيريا للشهر الماضي.'),'deleted',-25);
  add('export','bin','Session_Export.csv',text('A deleted export contains event AUTH-204 and device WS-27. The deletion record does not identify the person who removed it.','يتضمن التصدير المحذوف الحدث AUTH-204 والجهاز WS-27. لا يحدّد سجل الحذف الشخص الذي أزال الملف.'),'deleted',-9,{event:'AUTH-204',device:'WS-27'},true);
  const s1=mission.decisions?.station01;
  if(s1?.linkOpened && mission.flags?.suspiciousLinkOpened && s1.link?.destination) {
    // A navigation record is not proof of a download, credential submission, or MFA approval.
    const timestamp=mission.decisions.OPEN_PHISHING_LINK?.recordedAt||s1.completedAt||s1.assignedAt||time(0);
    add('navigation','downloads','Browser_Navigation_Record.json',text('Automatically saved navigation metadata. The browser opened this address; the record does not show a submitted form or an executed file.','بيانات تنقّل حُفظت تلقائيًا. فتح المتصفح هذا العنوان؛ ولا يثبت السجل إرسال نموذج أو تشغيل ملف.'),'navigation',0,{url:s1.link.destination,event:'NAV-031'},true,'station01.linkOpened',timestamp);
    add('web-access','logs',text('Browser connection','اتصال المتصفح'),text('An address was opened during the message session. Event NAV-031.','فُتح عنوان أثناء جلسة الرسالة. الحدث NAV-031.'),'access',0,{url:s1.link.destination,event:'NAV-031'},true,'station01.linkOpened',timestamp);
  }
  for(const [objectId,actionId,id,title,description,device] of [
    ['usb','connect','usb',text('Removable USB storage','وحدة تخزين USB قابلة للإزالة'),text('USB storage connected. First recorded connection in this workstation history. No file execution is recorded.','تم توصيل وحدة تخزين USB. هذا أول اتصال مسجّل لها في سجل الجهاز. لا يوجد تشغيل ملف مسجّل.'),'USB-NEW-01'],
    ['cable','connect','peripheral',text('USB peripheral','جهاز طرفي USB'),text('A peripheral connection was recorded. The device is not listed in the assigned equipment inventory.','تم تسجيل اتصال جهاز طرفي غير مدرج ضمن الأجهزة المخصّصة للموظف.'),'PER-NEW-01']
  ]) {
    const decision=mission.decisions?.station02?.items?.[objectId];
    if(decision?.actionId===actionId)add(id,'devices',title,description,'device',0,{device},true,`station02.items.${objectId}`,decision.recordedAt||time(0));
  }
  return records;
}

// UI receives only display fields; relevance and decision relationships stay out of rendered content.
export function participantRecords(mission) {
  return (mission.caseFile?.records||buildInvestigation(mission)).map(({isIncidentRelevant,relatedDecision,...record})=>record);
}
