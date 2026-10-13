// Paired, persisted correspondence. Sender selection never depends on the answer.
export const VAULT_MAIL_VARIANTS={
 'drop-first-2':[
  ['صباح الخير، قارنت مرجع المراجعة في {doc} بسجل المتابعة. أول رقمين مو موجودين في السجل، والباقي مطابق وبنفس الترتيب. حبيت أوضح الفرق قبل تسليم النسخة.','Morning, I compared the review reference in {doc} with the tracking record. The record omits the first two digits; the rest match in the same order. I wanted to clarify this before handover.'],
  ['يعطيكم العافية، للتوضيح عند استلام الملف: مرجع {doc} هو النسخة الكاملة. المرجع اللي اعتمدناه للمتابعة ما فيه أول رقمين، وبقية الخانات نفسها.','Hello, a note for the file handover: {doc} carries the full review reference. The tracking reference omits its first two digits; the remaining digits are unchanged.'],
  ['أهلًا، الفرق بين المرجعين مو خطأ في النسخ. سجل المراجعة يعتمد مرجع {doc} من دون أول رقمين فقط؛ ما تغيّر شيء بعدها.','Hi, the difference between the references is not a copying error. The review record uses the reference from {doc} without its first two digits. Nothing else changed.']
 ],
 'drop-last-2':[
  ['صباح الخير، خلصت مطابقة {doc}. مرجع السجل النهائي مطابق لمرجعه، لكن من دون آخر رقمين. هذا سبب اختلاف الطول بين النسختين.','Morning, I finished checking {doc}. The final record uses the same review reference without its last two digits. That explains the different lengths.'],
  ['بخصوص المرجع الأقصر في سجل المتابعة: آخر رقمين من مرجع {doc} ما انتقلوا للسجل، وما فيه اختلاف في بقية الأرقام.','About the shorter tracking reference: the last two digits of the review reference in {doc} were omitted. All the other digits match.'],
  ['يعطيكم العافية، نسخة التسليم تعتمد مرجع {doc} بعد استبعاد آخر رقمين منه. النسخة الكاملة باقية في المستند؛ الاختلاف فقط في نهاية المرجع.','Hello, the handover record uses the review reference from {doc} with its last two digits omitted. The full reference remains in the document; only the ending differs.']
 ],
 'first-4':[
  ['أهلًا، تأكدت أن الملف هو نفسه. المرجع المختصر عندنا يطابق أول أربع خانات من مرجع المراجعة في {doc}، بنفس ترتيبها.','Hi, I confirmed it is the same file. Our short reference matches the first four digits of the review reference in {doc}, in the same order.'],
  ['صباح الخير، أرسلت ملاحظات المراجعة. للتوضيح، رقم المتابعة مأخوذ من أول أربعة أرقام في مرجع {doc}؛ لذلك هو أقصر من الرقم المطبوع.','Morning, I sent the review comments. The tracking number uses the first four digits of the review reference in {doc}, which explains why it is shorter than the printed number.'],
  ['يعطيكم العافية، سجل الفريق يعتمد بداية مرجع {doc} فقط: أول أربع خانات كما هي. لاحظت أن نسخة المراسلات ما زالت تعرض المرجع كاملًا.','Hello, the team record uses only the beginning of the review reference in {doc}: its first four digits unchanged. I noticed the correspondence copy still shows the full reference.']
 ],
 'last-4':[
  ['صباح الخير، النسخة اللي عندنا صحيحة. رقم المتابعة فيها يطابق آخر أربع خانات من مرجع {doc}، مو بدايته.','Morning, our copy is correct. Its tracking number matches the last four digits of the review reference in {doc}, not the beginning.'],
  ['أهلًا، راجعت اختلاف المرجع في نسخة المتابعة. السجل يعتمد آخر أربعة أرقام من مرجع {doc} وبنفس الترتيب؛ باقي بيانات المراجعة متطابقة.','Hi, I checked the different reference in the tracking copy. The record uses the last four digits of the review reference in {doc}, in the same order. The other review details match.'],
  ['قبل تسليم الملف، حبيت أوضح أن المرجع المختصر في سجلنا هو نهاية مرجع {doc}: آخر أربع خانات فقط. لا نحتاج تحديث المستند بسبب هذا الفرق.','Before handing over the file, our short reference is the ending of the review reference in {doc}: only the last four digits. The document does not need updating because of this difference.']
 ],
 'plus-2-last-2':[
  ['صباح الخير، مرجع السجل المعتمد يبدأ بنفس أول خانتين من مرجع {doc}، لكن العدد في آخر خانتين أكبر باثنين. تأكدوا أن نسخة المتابعة تعكس آخر مراجعة.','Morning, the approved record keeps the first two digits of the review reference in {doc}, but the number formed by its final two digits is two higher. Please check the tracking copy reflects the latest review.'],
  ['يعطيكم العافية، اتضح سبب اختلاف المرجعين: آخر خانتين في السجل، كعدد واحد، تزيد باثنين عن آخر خانتين في مرجع {doc}. البداية ما تغيّرت.','Hello, the difference is clear now: the final two digits in the record, treated as one number, are two higher than the final two digits of the review reference in {doc}. The beginning is unchanged.'],
  ['أهلًا، انتهيت من المطابقة. التحديث في مرجع السجل كان زيادة بمقدار اثنين على العدد المكوّن من آخر خانتين في مرجع {doc}؛ أول خانتين بقيت نفسها.','Hi, reconciliation is complete. The record increased the number formed by the final two digits of the review reference in {doc} by two. Its first two digits stayed the same.']
 ],
 'minus-2-last-2':[
  ['صباح الخير، فيه فرق بسيط بين مرجع {doc} والسجل المعتمد: العدد في آخر خانتين بالسجل أقل باثنين، وأول خانتين نفسها.','Morning, there is a small difference between the review reference in {doc} and the approved record: the number formed by the final two digits is two lower in the record. The first two digits are unchanged.'],
  ['أهلًا، نسخة التسليم ما زالت تحمل مرجع {doc}. المرجع الأخير في السجل له نفس البداية، لكن آخر خانتين، كعدد واحد، أقل منه باثنين.','Hi, the handover copy still carries the review reference from {doc}. The final record has the same first two digits, but its final two digits, as one number, are two lower.'],
  ['يعطيكم العافية، تأكدت من ملاحظة المرجع. التصحيح في السجل خفّض العدد المكوّن من آخر خانتين بمقدار اثنين مقارنةً بمرجع {doc}، من دون تغيير أول خانتين.','Hello, I checked the reference note. The correction in the record reduced the number formed by the final two digits by two compared with the review reference in {doc}, without changing the first two digits.']
 ],
 'double-last-2':[
  ['صباح الخير، لاحظت أن مرجع السجل الجديد له نفس أول خانتين من مرجع {doc}، لكن العدد في آخر خانتين صار ضعفه. تأكدوا من نسخة المتابعة قبل التسليم.','Morning, the new record keeps the first two digits of the review reference in {doc}, but the number formed by its final two digits has doubled. Please check the tracking copy before handover.'],
  ['بخصوص اختلاف المرجع، أول خانتين متطابقتان. آخر خانتين في السجل، محسوبتان كعدد واحد، تساويان ضعف آخر خانتين في مرجع {doc}.','About the reference difference: the first two digits match. The final two digits in the record, treated as one number, are twice the number formed by the final two digits of the review reference in {doc}.'],
  ['يعطيكم العافية، خلصت مقارنة النسختين. السجل النهائي احتفظ ببداية مرجع {doc}، واعتمد ضعف العدد المكوّن من آخر خانتين. ما فيه تغيير آخر في المرجع.','Hello, I finished comparing the copies. The final record kept the first two digits of the review reference in {doc} and doubled the number formed by its final two digits. Nothing else changed.']
 ]
};

export function bindVaultMail(record,mail,document){
 const v=record.vaultAssignment,person=v.sender;
 if(!person||!VAULT_MAIL_VARIANTS[v.ruleId]?.[v.templateIndex])throw new Error('Missing saved vault correspondence assignment');
 const pair=VAULT_MAIL_VARIANTS[v.ruleId][v.templateIndex];
 const doc=record.caseAssignment.definition.id==='case-03'?{ar:'كشف المدفوعات',en:'the payment worksheet'}:{ar:'الفاتورة المعدلة',en:'the revised invoice'};
 mail.description=Object.fromEntries(['ar','en'].map((lang,i)=>[lang,
  pair[i].replaceAll('{doc}',doc[lang])+ (v.reference.length===4?(lang==='ar'?'\nالمرجع في السجل محفوظ بأربع خانات، بما فيها الأصفار.':'\nThe record retains four digits, including zeros.'):'')+
  (lang==='ar'?'\n\nشكرًا،\n':'\n\nThank you,\n')+person.name[lang]]));
 mail.metadata={...mail.metadata,from:`${person.id}@example.com`,senderName:structuredClone(person.name)};
 if(mail.metadata.readablePresentation?.version===1){
  mail.metadata.readablePresentation.metadata={...mail.metadata.readablePresentation.metadata,
   from:mail.metadata.from,senderName:structuredClone(person.name)};
 }
 // Retain the existing evidence ID, title, timestamp and scoring tags.
 v.emailSnapshot=structuredClone(mail);
 v.referenceDocumentId=document.id;
}
