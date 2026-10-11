import assert from 'node:assert/strict';
import { SMS_SCENARIOS } from '../src/data/smsScenarios.js';
import { LINK_PREVIEWS, getLinkPreview } from '../src/data/linkPreviews.js';
import { DESK_OBJECTS } from '../../shared/deskObjects.mjs';
import { normalizeLanguage } from '../../shared/language.mjs';
import { assignDataChallenge } from '../../backend/src/station03Sharing.js';
import { buildInvestigation } from '../../shared/station03Content.mjs';
import { workstationRecord } from '../src/stations/Station03/workstationPresentation.js';
import { translate, localizeDisplay } from '../src/locales/translate.js';
assert.equal(normalizeLanguage(), 'ar');assert.equal(normalizeLanguage('en'),'en');assert.equal(normalizeLanguage('fr'),'ar');
assert.equal(translate('Player Name','ar'),'اسم اللاعب');assert.equal(translate('Player Name','en'),'Player Name');
assert.equal(translate('GET MISSION READY','ar'),'استعد للمهمة');assert.equal(translate('GET MISSION READY','en'),'GET MISSION READY');
assert.equal(translate('Choose your name and avatar, then continue to the mission briefing.','ar'),'اختر اسمك وصورتك، ثم تابع إلى تعليمات المهمة.');
assert.equal(translate('Choose your name and avatar, then continue to the mission briefing.','en'),'Choose your name and avatar, then continue to the mission briefing.');
assert.equal(translate('Change Avatar','ar'),'تغيير الصورة');assert.equal(translate('Change Avatar','en'),'Change Avatar');
assert.equal(translate('CONTINUE','ar'),'متابعة');assert.equal(translate('CONTINUE','en'),'CONTINUE');
assert.equal(translate('اكتب اسمك','ar'),'اكتب اسمك');assert.equal(translate('Enter your name','en'),'Enter your name');
const original=JSON.stringify(SMS_SCENARIOS);
function translated(value){assert(/[\u0600-\u06ff]/.test(translate(value)),`Missing Arabic: ${value}`);assert.equal(translate(value,'en'),value);}
for(const scenario of SMS_SCENARIOS){
 for(const template of scenario.messageTemplates){
  translated(template);
  const rendered=template.replace(/\{(\w+)\}/g,(_,key)=>({systemName:'Atlas Portal',maintenanceWindow:'tonight at 8:30 PM',department:'Finance',ticketNumber:'INC-A1234'}[key]||'REF-A1234'));
  translated(rendered);assert(!/[{}]/.test(translate(rendered)));
 }
 [...scenario.sender.names,scenario.sender.verificationLabel,scenario.messageContext].forEach(translated);
 const display=localizeDisplay(scenario,'ar');assert.equal(display.id,scenario.id);assert.equal(display.classification,scenario.classification);assert.equal(display.expectedDecision,scenario.expectedDecision);assert.deepEqual(display.link,scenario.link);
}
assert.equal(JSON.stringify(SMS_SCENARIOS),original);
for(const item of DESK_OBJECTS){translated(item.name);item.details.flat().forEach(translated);item.actions.forEach(([,label])=>translated(label));const display=localizeDisplay(item,'ar');assert.equal(display.id,item.id);assert.deepEqual(display.actions.map(x=>x[0]),item.actions.map(x=>x[0]));assert.equal(display.x,item.x);assert.equal(display.y,item.y);}
for(const [id, preview] of Object.entries(LINK_PREVIEWS)){
 const arabicPreview=getLinkPreview(id,'ar');
 [preview.brand,preview.title,preview.description,preview.action,...preview.facts.flat(),...(preview.fields||[])].filter(v=>/[A-Za-z]/.test(v)).forEach(value=>{
  assert(value&&arabicPreview&&JSON.stringify(arabicPreview).includes(value)===false,`Missing Arabic preview translation: ${value}`);
 });
}
const challenge=assignDataChallenge('2026-10-07T08:00:00.000Z');
function localizedPair(pair){assert(pair.en&&pair.ar);assert(/[\u0600-\u06ff]/.test(pair.ar),`Missing Arabic Station03 copy: ${pair.en}`);assert.notEqual(pair.en,pair.ar);assert.equal(translate(pair.en,'en'),pair.en);}
assert.equal(translate('Read the message and choose the appropriate response.','ar'),'اقرأ الرسالة واختر الإجابة المناسبة.');
const questionCopy=challenge.questions.flatMap(question=>[
 question.prompt,question.context.sender,question.context.subject,question.context.body,
 ...question.options.map(option=>option.label)
]);
for(const pair of [challenge.title,...questionCopy])localizedPair(pair);
assert.deepEqual(challenge.questions.map(question=>question.prompt.en),[
 'What data classification level allows data to be shared outside the Fund without an agreement?',
 'Your department has an active project and needs data from an external organization. Which department is responsible for requesting data from outside the Fund?',
 'A trusted friend at another government entity asks for data held by your department on your work computer. How would you share it?'
]);
assert.equal(new Set(challenge.questions.map(question=>question.context.subject.en)).size,3);
assert(/[\u0600-\u06ff]/.test(challenge.document.description.ar));
assert.equal(translate(challenge.document.filename,'ar'),'ملخص_البيانات_المالية_للصندوق.xlsx');
const emails=buildInvestigation({startedAt:'2026-10-07T08:00:00.000Z'});
const newMailIds=['s03:stc-account-update','s03:alrajhi-verification','s03:workplace-coordination'];
const newMail=newMailIds.map(id=>workstationRecord(emails.find(item=>item.id===id)));
assert.deepEqual(newMail.map(item=>item.metadata.from),[
 'support@stc-account-update.invalid',
 'security@alrajhi-account-check.invalid',
 'workplace.services@environment-fund.invalid'
]);
assert.deepEqual(newMail.slice(0,2).map(item=>item.metadata.url),[
 'https://account-stc-update.invalid/profile',
 'https://alrajhi-verify.invalid/activity'
]);
assert(newMail.every(item=>item.evidenceEligible===false));
for(const item of newMail){
 assert(!item.metadata.from.includes('example'));
 assert(item.metadata.from.endsWith('.invalid'));
 for(const pair of [item.title,item.description,item.metadata.senderName,...[item.metadata.buttonText,item.metadata.linkText].filter(Boolean)])localizedPair(pair);
 assert(item.metadata.from.endsWith('.invalid'));
 if(item.metadata.url)assert(item.metadata.url.startsWith('https://')&&new URL(item.metadata.url).hostname.endsWith('.invalid'));
}
assert.equal(newMail[0].metadata.senderName.en,'STC Customer Care');
assert.equal(newMail[1].metadata.senderName.en,'Al Rajhi Bank');
assert.equal(newMail[2].metadata.senderName.en,'Workplace Services');
console.log('Localization passed: SMS, links, desk objects, exact Station03 questions and contextual cards, bilingual Inbox mail, default language and stable English IDs/action keys.');
