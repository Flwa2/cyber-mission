// Final feedback only. Derive from the saved assignment, never reroll or rescore.
export function station04Result(record) {
 const decision=record.mission.decisions?.station04,assignment=record.mission.narrativeAssignment;
 if(record.phase!=='COMPLETED'||record.mission.status!=='complete'||!decision?.completedAt||![2,3].includes(decision.version)||!assignment)return null;
 const person=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 const selected=assignment.choices.find(p=>p.id===decision.associatedPersonSelection);
 if(!person||!selected)return null;
 const explanation={
  'case-01':{en:'The transfer record and contact directory connect this account to the operations list. The activity record shows the list being shared outside the organization, followed by deletion of the downloaded copy.',ar:'يربط سجل النقل ودليل التواصل هذا الحساب بقائمة العمليات. ويُظهر سجل النشاط مشاركة القائمة خارج الجهة، ثم حذف النسخة المنزّلة.'},
  'case-02':{en:'The benefits message and download refer to the same account. A later record shows access from an unlisted device, followed by an external mail-forwarding rule that was not part of the original request.',ar:'تشير رسالة المزايا والتنزيل إلى الحساب نفسه. ويُظهر سجل لاحق الدخول من جهاز غير مدرج، ثم إنشاء قاعدة لتحويل البريد خارج الجهة، دون أن يتضمن الطلب الأصلي ذلك.'},
  'case-03':{en:'The printed finance reference connects this account to the exported payment file. The same reference appears in the external-sharing record and the deleted sharing receipt.',ar:'يربط المرجع المالي المطبوع هذا الحساب بملف المدفوعات المُصدّر. ويظهر المرجع نفسه في سجل المشاركة الخارجية وإيصال المشاركة المحذوف.'},
  'case-04':{en:'The planning records connect this account to the project package. The download precedes the external upload, and the delivery receipt links the shared copy to that same package.',ar:'تربط سجلات التخطيط هذا الحساب بحزمة المشروع. ويسبق التنزيل الرفع الخارجي، ويربط إيصال التسليم النسخة المشتركة بالحزمة نفسها.'}
 }[record.caseAssignment?.definition.id];
 if(!explanation)return null;
 return {correctPerson:{id:person.id,name:person.name},selectedPerson:{id:selected.id,name:selected.name},correct:selected.id===person.id,explanation};
}
