import {NARRATIVE_CHARACTERS} from './narrativeCharacters.mjs';
const SCENARIOS=['document-link','sharing-request','sign-in-request'];
export function createNarrativeAssignment(random,now=new Date().toISOString(),{legacy=false}={}){
 const associated=legacy?NARRATIVE_CHARACTERS[0]:NARRATIVE_CHARACTERS[random(NARRATIVE_CHARACTERS.length)];
 let choices;
 if(legacy)choices=['nora','sara','khalid'].map(id=>NARRATIVE_CHARACTERS.find(p=>p.id===id));
 else{
  const others=NARRATIVE_CHARACTERS.filter(p=>p.id!==associated.id);
  const first=others.splice(random(others.length),1)[0],second=others[random(others.length)];
  choices=[associated,first,second];
  for(let i=choices.length-1;i>0;i--){const j=random(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 }
 return {version:1,assignedAt:now,scenarioId:legacy?'document-link':SCENARIOS[random(SCENARIOS.length)],associatedPersonId:associated.id,choices:structuredClone(choices),...(legacy?{migration:'legacy-fixed-sara'}:{})};
}
export function publicNarrativeAssignment(assignment){
 if(!assignment)return undefined;
 return {version:assignment.version,assignedAt:assignment.assignedAt,choices:structuredClone(assignment.choices)};
}
export function narrativeClue(assignment){
 const person=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 const descriptions={
  'document-link':{en:'The review pack is ready in the team folder. I prepared the printed copies on the desk. Please return comments in the working file; I still need to check the final figures before the meeting.',ar:'ملف المراجعة جاهز في مجلد الفريق، وأعددت النسخ المطبوعة الموجودة على المكتب. يرجى إضافة الملاحظات في نسخة العمل؛ ما زلت بحاجة إلى مراجعة الأرقام النهائية قبل الاجتماع.'},
  'sharing-request':{en:'I have put the review pack in the team folder and left the printed copies on the desk. Please let me know who needs access for the meeting so I can update the circulation list.',ar:'وضعت ملف المراجعة في مجلد الفريق وتركت النسخ المطبوعة على المكتب. يرجى إبلاغي بمن يحتاج إلى الاطلاع عليه للاجتماع لتحديث قائمة التوزيع.'},
  'sign-in-request':{en:'The printed review pack is on the desk. I will finish checking the working copy after the meeting-room booking is confirmed. Please keep comments in the team folder so we do not end up with several versions.',ar:'نسخة المراجعة المطبوعة موجودة على المكتب. سأستكمل مراجعة نسخة العمل بعد تأكيد حجز قاعة الاجتماع. يرجى وضع الملاحظات في مجلد الفريق لتجنب تعدد النسخ.'}
 };
 const body=descriptions[assignment.scenarioId]||descriptions['document-link'];
 return {title:{en:'Review pack for the meeting',ar:'ملف المراجعة للاجتماع'},description:{en:`Hello,\n\n${body.en}\n\nThank you,\n${person.name.en}`,ar:`السلام عليكم،\n\n${body.ar}\n\nشكرًا،\n${person.name.ar}`},metadata:{from:`${person.id}@example.com`,senderName:person.name,identityVersion:2}};
}
export function seededNarrativeRandom(seed){
 let n=2166136261;for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);
 return maximum=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)%maximum;};
}
