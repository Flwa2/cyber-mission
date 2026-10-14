// Final feedback only. Derive from the saved assignment, never reroll or rescore.
export function station04Result(record) {
 const decision=record.mission.decisions?.station04,assignment=record.mission.narrativeAssignment;
 if(record.phase!=='COMPLETED'||record.mission.status!=='complete'||!decision?.completedAt||![2,3].includes(decision.version)||!assignment)return null;
 const person=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 const selected=assignment.choices.find(p=>p.id===decision.associatedPersonSelection);
 if(!person||!selected)return null;
 const explanation={
  'case-01':{item:{en:'operations list',ar:'قائمة العمليات'},en:'The transfer record and the contact directory both tie this account to the operations list. The activity record then shows the list being shared outside the organization and the downloaded copy being deleted.',ar:'يربط سجل النقل ودليل التواصل هذا الحساب بقائمة العمليات. ثم يُظهر سجل النشاط مشاركة القائمة خارج الجهة وحذف النسخة المنزّلة.'},
  'case-02':{item:{en:'benefits message and download',ar:'رسالة المزايا والتنزيل'},en:'The benefits message and the download both refer to the same account. A later record shows a sign-in from an unlisted device, followed by a rule forwarding mail outside the organization that the original request did not include.',ar:'تشير رسالة المزايا والتنزيل إلى الحساب نفسه. ثم يُظهر سجل لاحق تسجيل دخول من جهاز غير مدرج، يليه إنشاء قاعدة لتحويل البريد خارج الجهة لم يتضمنها الطلب الأصلي.'},
  'case-03':{item:{en:'exported payment file',ar:'ملف المدفوعات المُصدّر'},en:'The printed finance reference ties this account to the exported payment file. The same reference appears in the external-sharing record and in the deleted sharing receipt.',ar:'يربط المرجع المالي المطبوع هذا الحساب بملف المدفوعات المُصدّر. ويظهر المرجع نفسه في سجل المشاركة الخارجية وفي إيصال المشاركة المحذوف.'},
  'case-04':{item:{en:'project package',ar:'حزمة المشروع'},en:'The planning records tie this account to the project package. The download comes before the external upload, and the delivery receipt links the shared copy to that same package.',ar:'تربط سجلات التخطيط هذا الحساب بحزمة المشروع. يأتي التنزيل قبل الرفع الخارجي، ويربط إيصال التسليم النسخة المشتركة بالحزمة نفسها.'}
 }[record.caseAssignment?.definition.id];
 if(!explanation)return null;
 const correct=selected.id===person.id,s=selected.name,p=person.name;
 const why={en:`Why: ${explanation.en}`,ar:`السبب: ${explanation.ar}`};
 if(!correct){
  why.en+=` For ${s.en}, the records you reviewed do not link that account to the ${explanation.item.en} in the same way, so ${p.en} is better supported by this evidence.`;
  why.ar+=` أما ${s.ar} فلا تربط السجلات التي راجعتها حسابه بـ${explanation.item.ar} بالطريقة نفسها، لذلك تدعم هذه الأدلة ${p.ar} بدرجة أكبر.`;
 }
 const conclusion=correct
  ?{en:'Conclusion: The records link this account to the suspicious activity. They do not show who acted or why, so they do not establish malicious intent.',ar:'الخلاصة: تربط السجلات هذا الحساب بالنشاط المشبوه، لكنها لا تبيّن من تصرّف ولا لماذا، ولذلك لا تثبت وجود نية ضارة.'}
  :{en:`Conclusion: The evidence points to ${p.en}'s account rather than ${s.en}'s. It still shows only the activity linked to that account; it does not prove malicious intent.`,ar:`الخلاصة: تشير الأدلة إلى حساب ${p.ar} لا إلى حساب ${s.ar}. ومع ذلك فهي تُظهر النشاط المرتبط بالحساب فقط، ولا تثبت وجود نية ضارة.`};
 return {correctPerson:{id:person.id,name:person.name},selectedPerson:{id:selected.id,name:selected.name},correct,explanation:why,conclusion};
}
