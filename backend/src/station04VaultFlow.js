import {vaultRule} from './station04VaultRules.js';
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
   en:[`${names.accuser.en}: The OP-42 visit list was only meant to stay in the operations folder. Nobody asked for it to be shared externally.`,`${names.target.en}: I was still working through the list. I had not agreed that it would leave the operations folder.`,`${names.witness.en}: The transfer register shows OP-42 left from WS-27 and went to share-files.example.net.`,`${names.accuser.en}: Then the register, the deleted download and the folder history need to be read together, because the request was internal only.`],
   ar:[`${names.accuser.ar}: كان المقصود أن تبقى قائمة الزيارات OP-42 داخل مجلد العمليات، ولم يطلب أحد مشاركتها خارجياً.`,`${names.target.ar}: كنت لا أزال أراجع القائمة، ولم أوافق على خروجها من مجلد العمليات.`,`${names.witness.ar}: يُظهر سجل النقل أن OP-42 خرجت من WS-27 إلى share-files.example.net.`,`${names.accuser.ar}: إذن يجب قراءة سجل النقل والتنزيل المحذوف وسجل المجلد معاً، فالطلب كان داخلياً فقط.`]},
  'case-02':{
   en:[`${names.accuser.en}: HR-18 was only a request to review the benefits file. Nobody asked for any change to mailbox forwarding.`,`${names.target.en}: I did not approve forwarding notices to archive@review-mail.example.net.`,`${names.witness.en}: The mailbox log runs in this order: the benefits email, the Update.zip download, a sign-in from an unlisted device, then the forwarding rule.`,`${names.accuser.en}: The request explains the document, but not the unlisted-device sign-in or the forwarding address.`],
   ar:[`${names.accuser.ar}: كان HR-18 مجرد طلب لمراجعة ملف المزايا، ولم يطلب أحد تغيير تحويل البريد.`,`${names.target.ar}: لم أوافق على تحويل الإشعارات إلى archive@review-mail.example.net.`,`${names.witness.ar}: يسير سجل البريد بهذا الترتيب: رسالة المزايا، ثم تنزيل Update.zip، ثم تسجيل دخول من جهاز غير مدرج، ثم قاعدة التحويل.`,`${names.accuser.ar}: الطلب يفسر المستند، لكنه لا يفسر تسجيل الدخول من الجهاز غير المدرج ولا عنوان التحويل.`]},
  'case-03':{
   en:[`${names.accuser.en}: The supplier asked us to confirm invoice items. Nobody asked for a copy of Payments_Oct.xlsx to be sent outside.`,`${names.target.en}: I did not send the worksheet to the supplier address. Invoice 1048 was still waiting for approval.`,`${names.witness.en}: The payment had not been released. The FN-63 export and the external link were recorded while approval was still pending.`,`${names.accuser.en}: So the question is who created the external link to a worksheet that was not yet approved.`],
   ar:[`${names.accuser.ar}: طلب المورد تأكيد بنود الفاتورة، ولم يطلب أحد إرسال نسخة من Payments_Oct.xlsx إلى الخارج.`,`${names.target.ar}: لم أرسل الكشف إلى عنوان المورد. كانت الفاتورة 1048 لا تزال بانتظار الاعتماد.`,`${names.witness.ar}: لم تُصرف الدفعة. سُجّل تصدير FN-63 والرابط الخارجي بينما الاعتماد لا يزال معلقاً.`,`${names.accuser.ar}: إذن السؤال هو من أنشأ الرابط الخارجي لكشف لم يُعتمد بعد.`]},
  'case-04':{
   en:[`${names.accuser.en}: Project_Sept.zip was for the internal planning folder. The delivery receipt names a separate external sharing service.`,`${names.target.en}: I did not agree to put the project package in an external workspace.`,`${names.witness.en}: The PL-85 package was downloaded first, and the receipt shows the later upload went from the planning account to the external service.`,`${names.accuser.en}: The question is who started the upload, since the package was only meant to stay internal.`],
   ar:[`${names.accuser.ar}: كان Project_Sept.zip مخصصاً لمجلد التخطيط الداخلي، ويذكر إيصال التسليم خدمة مشاركة خارجية منفصلة.`,`${names.target.ar}: لم أوافق على وضع حزمة المشروع في مساحة خارجية.`,`${names.witness.ar}: نُزّلت حزمة PL-85 أولاً، ويُظهر الإيصال أن الرفع اللاحق تم من حساب التخطيط إلى الخدمة الخارجية.`,`${names.accuser.ar}: السؤال هو من بدأ الرفع، فالحزمة كان يفترض أن تبقى داخلية فقط.`]}
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
  references:{documents:(sources.documents||[sources.document]).filter(Boolean).map(source),document:primary?source(primary):null,email:sources.email?source(sources.email):null},
  ...(record.vaultAssignment.contentVersion===2&&(state.hintLevel||0)>=2?{hintRule:{en:vaultRule(record.vaultAssignment.ruleId).en,ar:vaultRule(record.vaultAssignment.ruleId).ar}}:{}),
  ...(state.unlockedAt?{discovery:structuredClone(state.discovery)}:{}),
  ...(state.revealedAt?{revealedCode:record.vaultAssignment.code}:{})};
}
