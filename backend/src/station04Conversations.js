// Recovered Station 04 conversations. Speakers a/b/c are the three suspects in
// roster order. The roster order is shuffled independently of the correct
// suspect, and nobody here claims a factual action: the facts come from the
// records, read aloud in the passive voice, so a speaker's role never reveals
// the answer.
const line=(n,speaker,text)=>`${n[speaker]}: ${text}`;

export function conversationFor(caseId,names){
 const en={a:names.a.en,b:names.b.en,c:names.c.en},ar={a:names.a.ar,b:names.b.ar,c:names.c.ar};
 const l=(lang,speaker,text)=>line(lang==='en'?en:ar,speaker,text);
 const set={
  'case-01':{
   en:[
    l('en','a','Morning. I got an alert saying the operations contact list was shared with an outside site. Does anyone know about that?'),
    l('en','b','Nobody asked me to share it with anyone. It was supposed to stay in the operations folder. When did this happen?'),
    l('en','c','I just checked the transfer log. The list was downloaded from the internal portal first, and a little later there is an entry sending it from WS-27 to share-files.example.net.'),
    l('en','a','Did anything else happen after that?'),
    l('en','c','The downloaded copy was deleted from the computer after it was shared. That is all the log shows. It does not say why it was sent.'),
    l('en','b','Then let us not blame anyone yet. We can compare the sharing entry with the printed register on the desk and see who was using that computer.')],
   ar:[
    l('ar','a','صباح الخير. وصلني تنبيه أن قائمة الاتصال الخاصة بالعمليات تمت مشاركتها مع موقع خارجي. هل أحد عنده خبر؟'),
    l('ar','b','ما طلب مني أحد أشاركها مع أي جهة. المفروض تبقى داخل مجلد العمليات. متى صار هذا؟'),
    l('ar','c','راجعت سجل النقل الحين. القائمة نُزّلت أول شيء من البوابة الداخلية، وبعدها بقليل فيه تسجيل لإرسالها من الجهاز WS-27 إلى share-files.example.net.'),
    l('ar','a','وبعد الإرسال صار شيء ثاني؟'),
    l('ar','c','نسخة التنزيل انحذفت من الجهاز بعد المشاركة. هذا كل اللي يظهر في السجل، وما فيه ما يوضح ليش انرسلت.'),
    l('ar','b','طيب، خلونا ما نتهم أحد الحين. نقارن سجل المشاركة بالسجل المطبوع على المكتب ونشوف مين كان يستخدم هذا الجهاز.')]},
  'case-02':{
   en:[
    l('en','a','A message called "Benefits file available" came into the employee services account, and it has a link. Did anyone notice it?'),
    l('en','b','I saw it in the inbox. It said the benefits file HR-18 was available at benefits-review.example.net, and it looked like the usual HR messages.'),
    l('en','c','Shortly after that, a package called Update.zip was downloaded from the same address. I cannot say it was ever opened, but the download is recorded.'),
    l('en','a','And then?'),
    l('en','c','The account was signed in from a device that is not on the approved workstation list, and after that a rule was added that forwards account notices to archive@review-mail.example.net.'),
    l('en','b','That is strange, because the HR-18 request says nothing about changing mail forwarding.'),
    l('en','a','Let me ask IT for the approved device list so we can compare it with the device that signed in.')],
   ar:[
    l('ar','a','وصلت رسالة بعنوان «ملف المزايا متاح» على حساب خدمات الموظفين، وفيها رابط. أحد انتبه لها؟'),
    l('ar','b','شفتها في صندوق الوارد. كانت تقول إن ملف المزايا HR-18 متاح على benefits-review.example.net، وشكلها يشبه رسائل الموارد البشرية المعتادة.'),
    l('ar','c','بعدها بقليل نُزّلت حزمة اسمها Update.zip من نفس العنوان. ما أقدر أقول إنها انفتحت، لكن التنزيل مسجّل.'),
    l('ar','a','وبعد كذا؟'),
    l('ar','c','سُجّل دخول على الحساب من جهاز مو موجود في قائمة أجهزة المكتب المعتمدة، وبعده أُضيفت قاعدة تحوّل إشعارات الحساب إلى archive@review-mail.example.net.'),
    l('ar','b','هذا غريب، لأن طلب HR-18 ما فيه أي شيء عن تغيير تحويل البريد.'),
    l('ar','a','خلني أطلب من الدعم الفني قائمة الأجهزة المعتمدة، ونقارنها بالجهاز اللي دخل.')]},
  'case-03':{
   en:[
    l('en','c','Invoice 1048 is still waiting for approval, but the log shows an external link for Payments_Oct.xlsx. Does anyone know about it?'),
    l('en','a','The supplier only asked us to confirm the invoice items. They never asked for a copy of the worksheet. Where did the link come from?'),
    l('en','b','I went through the log. The FN-63 summary was saved from the internal finance portal, then a link was created for an address outside the company, review@vendor-copy.example.org, and afterwards the sharing receipt was deleted.'),
    l('en','a','Was the payment released?'),
    l('en','b','No, approval is still pending. What we can see is that the link was created. Nothing here says anyone used it.'),
    l('en','c','So the real question is not whether the money moved. It is who created that link before approval. Let us start with the computer WS-09 and the printed cover sheet.')],
   ar:[
    l('ar','c','الفاتورة 1048 للحين بانتظار الاعتماد، لكن السجل يوضح أن كشف المدفوعات Payments_Oct.xlsx له رابط خارجي. أحد يعرف عنه؟'),
    l('ar','a','المورد بس طلب نأكد له بنود الفاتورة، وما طلب نسخة من الكشف. من وين جا هذا الرابط؟'),
    l('ar','b','راجعت السجل. ملخص FN-63 انحفظ من بوابة المالية الداخلية، وبعده أُنشئ رابط لعنوان خارج الشركة هو review@vendor-copy.example.org، وبعدها انحذف إيصال المشاركة.'),
    l('ar','a','والدفعة انصرفت؟'),
    l('ar','b','لا، الاعتماد لسه معلّق. اللي نشوفه إن الرابط أُنشئ، وما فيه ما يقول إن أحد استخدمه.'),
    l('ar','c','يعني السؤال مو هل انصرفت الفلوس، السؤال من أنشأ الرابط قبل الاعتماد. نبدأ بالجهاز WS-09 وورقة الغلاف المطبوعة.')]},
  'case-04':{
   en:[
    l('en','b','I received a delivery notice from an outside workspace about the project package PL-85. That is odd, because it was supposed to stay in the internal planning workspace.'),
    l('en','c','What kind of notice? I do not remember anyone saying we would share it outside.'),
    l('en','a','I checked the log. First the delivery package was downloaded from the internal planning workspace. Then PL-85 was uploaded from WS-31 to a workspace outside the planning service. The notice came last.'),
    l('en','c','So the notice proves it arrived there?'),
    l('en','a','It proves it was received. It does not say who started the upload or why.'),
    l('en','b','Let us read the receipt itself and match it with the planning account and the computer before we decide anything.')],
   ar:[
    l('ar','b','وصلني إشعار تسليم من مساحة عمل خارجية على حزمة المشروع PL-85. غريب، لأنها المفروض تبقى في مساحة التخطيط الداخلية.'),
    l('ar','c','أي نوع إشعار؟ ما أذكر إن أحد قال إننا بنشاركها مع جهة خارجية.'),
    l('ar','a','راجعت السجل. أول شيء نُزّلت حزمة التسليم من مساحة التخطيط الداخلية، وبعدها رُفعت PL-85 من الجهاز WS-31 إلى مساحة خارج خدمة التخطيط، وآخر شيء جاء إشعار الاستلام.'),
    l('ar','c','يعني الإشعار يثبت إنها وصلت هناك؟'),
    l('ar','a','يثبت إنها استُلمت، لكنه ما يقول مين بدأ الرفع ولا ليش.'),
    l('ar','b','خلونا نقرأ الإيصال نفسه ونطابقه مع حساب التخطيط والجهاز قبل ما نقرر أي شيء.')]}
 };
 return set[caseId];
}
