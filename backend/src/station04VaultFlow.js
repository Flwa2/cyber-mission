// Missions already inside the old response flow keep that flow. New versioned
// missions must finish the archive before the existing response handler runs.
export const vaultEnabled=record=>record.vaultAssignment?.version===1&&(!record.mission.decisions.station04||record.vaultState?.version===1);
const normalizeCode=value=>typeof value==='string'?value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)):'';
const requestKey=body=>JSON.stringify([body.action,body.action==='vault-attempt'?normalizeCode(body.code):null,body.level??null]);
export function isVaultReplay(record,body){
 const prior=record.vaultState?.requests?.find(r=>r.id===body.requestId);
 if(!prior)return false;
 if(prior.key!==requestKey(body))throw new Error('Vault request ID was reused');
 return true;
}
function recoveredArchive(record){
 const definition=record.caseAssignment.definition;
 const assignment=record.mission.narrativeAssignment;
 const people=assignment?.choices||[];
 const target=people.find(p=>p.id===assignment?.associatedPersonId)||people[0];
 const others=people.filter(p=>p.id!==target?.id);
 const accuser=others[0]||target,witness=others[1]||accuser;
 const names={target:target?.name||{en:'the account owner',ar:'صاحب الحساب'},accuser:accuser?.name||{en:'a colleague',ar:'زميل'},witness:witness?.name||{en:'the reviewer',ar:'المراجع'}};
 const conversations={
  'case-01':{
   en:[`${names.accuser.en}: I only asked for the OP-42 visit list to stay in the operations folder. I did not request an external share.`,`${names.target.en}: The copy sent to share-files.example.net was not part of my handover. I was still checking the working list.`,`${names.witness.en}: The transfer register says OP-42 came from WS-27, but the visitor copy I received had no staff contact sheet.`,`${names.accuser.en}: Then the external copy included material that was not in the request. The folder history and the deleted download should be checked together.`],
   ar:[`${names.accuser.ar}: طلبت فقط إبقاء قائمة الزيارات OP-42 في مجلد العمليات، ولم أطلب مشاركتها خارجياً.`,`${names.target.ar}: النسخة التي أُرسلت إلى share-files.example.net لم تكن ضمن التسليم المطلوب. كنت لا أزال أراجع قائمة العمل.`,`${names.witness.ar}: يذكر سجل النقل أن OP-42 خرج من WS-27، لكن النسخة التي استلمها الزائر لم تتضمن قائمة تواصل الموظفين.`,`${names.accuser.ar}: إذن تضمنت النسخة الخارجية مادة لم يطلبها أحد. يجب فحص سجل المجلد مع نسخة التنزيل المحذوفة.`]},
  'case-02':{
   en:[`${names.accuser.en}: HR-18 was a request for the benefits file, not a change to account notifications.`,`${names.target.en}: I did not approve forwarding notices to archive@review-mail.example.net. That address was not in the request.`,`${names.witness.en}: The download and the forwarding rule were recorded after the same account was accessed from an unlisted device.`,`${names.accuser.en}: The missing approval is the contradiction: the package explains the document, but not the mailbox change.`],
   ar:[`${names.accuser.ar}: كان HR-18 طلباً لملف المزايا، وليس تغييراً في إشعارات الحساب.`,`${names.target.ar}: لم أوافق على تحويل الإشعارات إلى archive@review-mail.example.net. هذا العنوان غير موجود في الطلب.`,`${names.witness.ar}: سُجل التنزيل وقاعدة التحويل بعد الوصول إلى الحساب نفسه من جهاز غير مدرج.`,`${names.accuser.ar}: غياب الموافقة هو التناقض؛ فالحزمة تشرح المستند، لكنها لا تشرح تغيير البريد.`]},
  'case-03':{
   en:[`${names.accuser.en}: The supplier asked us to confirm invoice items. No one asked for a copy of Payments_Oct.xlsx.`,`${names.target.en}: I sent no worksheet to the supplier address. The revised invoice only changed the service description.`,`${names.witness.en}: Invoice 1048 was still awaiting approval when the FN-63 export and external link were recorded.`,`${names.accuser.en}: The unapproved worksheet is the missing piece; the invoice cannot explain the bank reference in the deleted receipt.`],
   ar:[`${names.accuser.ar}: طلب المورد تأكيد بنود الفاتورة، ولم يطلب أحد نسخة من Payments_Oct.xlsx.`,`${names.target.ar}: لم أرسل الكشف إلى عنوان المورد. الفاتورة المعدلة غيّرت وصف الخدمة فقط.`,`${names.witness.ar}: كانت الفاتورة 1048 بانتظار الاعتماد عند تسجيل تصدير FN-63 والرابط الخارجي.`,`${names.accuser.ar}: الكشف غير المعتمد هو الحلقة الناقصة؛ فلا تفسر الفاتورة مرجع الحساب في الإيصال المحذوف.`]},
  'case-04':{
   en:[`${names.accuser.en}: Project_Sept.zip was for the internal planning folder. The delivery receipt names a separate sharing service.`,`${names.target.en}: I did not add the site contacts to an external workspace. The meeting copy was meant to remain unchanged.`,`${names.witness.en}: The PL-85 package was downloaded before the external upload, and the receipt confirms it came from the planning account.`,`${names.accuser.en}: The contradiction is in the contents: the upload included the contact sheet although the circulation list did not.`],
   ar:[`${names.accuser.ar}: كان Project_Sept.zip مخصصاً لمجلد التخطيط الداخلي، ويذكر إيصال التسليم خدمة مشاركة منفصلة.`,`${names.target.ar}: لم أضف قائمة المواقع إلى مساحة خارجية. كان يفترض إبقاء نسخة الاجتماع دون تعديل.`,`${names.witness.ar}: نُزّلت حزمة PL-85 قبل الرفع الخارجي، ويؤكد الإيصال أنها خرجت من حساب التخطيط.`,`${names.accuser.ar}: التناقض في المحتوى؛ فقد تضمن الرفع قائمة المواقع رغم أنها لم تكن ضمن قائمة التوزيع.`]}
 }[definition.id];
 if(!conversations)throw new Error('Archive case is unavailable');
 const timestamp=new Date(Date.parse(record.mission.startedAt)+(Math.max(...definition.steps.map(s=>s.minute))+1)*60000).toISOString();
 return {id:'vault:recovered-conversation',title:{en:'Recovered conversation',ar:'محادثة مستعادة'},filename:'Recovered_Conversation.txt',timestamp,conversation:conversations,description:{en:conversations.en.join('\n\n'),ar:conversations.ar.join('\n\n')}};
}
export function recordVaultAction(record,body,now=new Date().toISOString()){
 if(!vaultEnabled(record)||!record.vaultAssignment.clueSources)throw new Error('Vault is unavailable for this mission');
 if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(body.requestId))throw new Error('Vault request ID is required');
 if(isVaultReplay(record,body))return;
 const state=structuredClone(record.vaultState||{version:1,hintLevel:0,awardAvailable:600,attemptCount:0,requests:[]});
 const time=Date.parse(now);
 if(body.action==='vault-attempt'){
  const code=normalizeCode(body.code);
  if(!/^\d{4}$/.test(code))throw new Error('Enter four digits');
  if(!state.unlockedAt){
   if(time<(Date.parse(state.cooldownUntil)||0))throw new Error('Please wait before trying again');
   state.attemptCount++;state.lastAttemptAt=now;
   if(code===record.vaultAssignment.code){state.unlockedAt=now;state.lastAttempt='unlocked';state.cooldownUntil=null;}
   else{state.lastAttempt='incorrect';state.cooldownUntil=new Date(time+2500).toISOString();}
  }
 }else if(body.action==='vault-hint'){
  if(![1,2,3].includes(body.level))throw new Error('Unknown vault hint');
  if(!state.unlockedAt&&body.level>state.hintLevel){
   if(body.level!==state.hintLevel+1)throw new Error('Use the next available hint');
   state.hintLevel=body.level;state.awardAvailable=({1:500,2:300,3:50})[body.level];
   if(body.level===3){state.revealedAt=now;state.unlockedAt=now;state.lastAttempt='revealed';state.cooldownUntil=null;}
  }
 }else if(body.action==='vault-continue'){
  if(!state.unlockedAt)throw new Error('Open the archive first');
  state.discoveryAcknowledgedAt ||= now;
 }else throw new Error('Unknown vault action');
 if(state.unlockedAt&&!state.discovery)state.discovery=recoveredArchive(record);
 // Keep every receipt for this finite mission so even an old retry is idempotent.
 // Never serialize attempted inputs or request fingerprints.
 state.requests=[...state.requests,{id:body.requestId,key:requestKey(body)}];
 record.vaultState=state;record.mission.updatedAt=now;
}
export function publicVault(record){
 if(record.stage!==4||!vaultEnabled(record)||!record.vaultAssignment.clueSources)return undefined;
 const state=record.vaultState||{},sources=record.vaultAssignment.clueSources;
 const source=r=>({id:r.id,title:r.title,description:r.description,timestamp:r.timestamp,
  ...(r.metadata?.from?{from:r.metadata.from,senderName:r.metadata.senderName}:{})});
 const primary=(sources.documents||[])[0]||sources.document;
 return {version:1,hintLevel:state.hintLevel||0,awardAvailable:state.awardAvailable??600,
  unlockedAt:state.unlockedAt||null,discoveryAcknowledgedAt:state.discoveryAcknowledgedAt||null,
  cooldownUntil:state.cooldownUntil||null,lastAttempt:state.lastAttempt||null,
  references:{documents:(sources.documents||[sources.document]).filter(Boolean).map(source),document:primary?source(primary):null},
  ...(state.unlockedAt?{discovery:structuredClone(state.discovery)}:{}),
  ...(state.revealedAt?{revealedCode:record.vaultAssignment.code}:{})};
}
