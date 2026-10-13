import assert from 'node:assert/strict';
import {assignDataChallenge,publicDataChallenge} from '../src/station03Sharing.js';
import {ensureStation03Experience} from '../src/station03Experience.js';
import {recordInvestigation} from '../src/station03Investigation.js';
import {publicMission,scoreCase,caseCatalog} from '../src/caseEngine.js';
import {CASES} from '../src/caseDefinitions.js';

const now='2026-10-07T08:00:00.000Z';
const make=()=>({
 stage:3,phase:'ACTIVE',order:8,missionId:'CM-SHARE1',
 mission:{missionId:'CM-SHARE1',startedAt:now,playerName:'Test',avatarId:'avatar-01',hiddenScore:7,hiddenAttackState:2,flags:{},evidence:[],decisions:{}}
});
const expected=['public','data-management-office','contact-data-management-office'];
const selected=[
 ['public','restricted','secret','top-secret'],
 ['general-it-digital-transformation','project-department','data-management-office','implementing-company'],
 ['whatsapp','personal-email','fund-email','contact-data-management-office']
];
const challenge=assignDataChallenge(now);
assert.equal(challenge.version,2);
assert.equal(challenge.questions.length,3);
assert.deepEqual(challenge.questions.map(question=>question.expectedAnswer),expected);
assert.deepEqual(challenge.questions.map(question=>question.id),['q1-public-classification','q2-request-external-data','q3-trusted-friend-sharing']);
assert.deepEqual(challenge.questions.map(question=>question.prompt.ar),[
 'ما هو مستوى تصنيف البيانات الذي يسمح بمشاركة البيانات خارج الصندوق بدون اتفاقية؟',
 'لدى إدارتك مشروع قائم ولإتمامه تحتاج إلى بيانات من جهة خارجية. من الإدارة المسؤولة عن طلب البيانات من جهات خارج الصندوق؟',
 'تواصل معك صديق تثق به من جهة حكومية أخرى وسأل عن إمكانية مشاركة بيانات تمتلكها إدارتك في الصندوق وهي موجودة على جهازك، كيف ستشاركها معه؟'
]);
assert.deepEqual(challenge.questions.map(question=>question.options.map(option=>option.label.ar)),[
 ['عام.','مقيد.','سري.','سري للغاية.'],
 ['الإدارة العامة لتقنية المعلومات والتحول الرقمي.','الإدارة التي يتبع لها المشروع.','مكتب إدارة البيانات.','الشركة المسؤولة عن تنفيذ المشروع.'],
 ['عن طريق تطبيق الواتساب.','عن طريق إيميلك الشخصي.','عن طريق إيميلك التابع للصندوق.','تتواصل معه عن طريق مكتب إدارة البيانات في الصندوق.']
]);
assert.equal(challenge.document.filename,'Fund_Financial_Data_Summary.xlsx');
assert.match(challenge.document.fictionalNote.en,/Fictional|invented/i);
assert.deepEqual(challenge.questions.map(question=>question.context.subject.en),[
 'Request to share programme information','Data needed for the active project','A quick question'
]);
assert.equal(challenge.questions[0].context.from,'data.office@environment-fund.invalid');
assert.equal(challenge.questions[1].context.from,'projects@environment-fund.invalid');
assert.equal(challenge.questions[2].context.from,'faisal@partner-government.invalid');
for(const question of challenge.questions){
 assert(!question.context.from.includes('example'));
 assert(question.context.from.endsWith('.invalid'));
}
assert.equal(challenge.questions[0].options.length,4);
assert.equal(challenge.questions[1].options.length,4);
assert.equal(challenge.questions[2].options.length,4);
assert.deepEqual(publicDataChallenge(challenge).questions.map(question=>question.id),challenge.questions.map(question=>question.id));
for(const key of ['expectedAnswer','points','maxPoints'])assert(!JSON.stringify(publicDataChallenge(challenge)).includes(key));

const authored=CASES[0],base=make();
base.caseAssignment={definition:authored};
ensureStation03Experience(base,caseCatalog(base));
assert.equal(base.station03Experience.dataChallenge.version,2);
const stable=structuredClone(base.station03Experience.dataChallenge);
for(let i=0;i<4;i++){
 const restored=structuredClone(base);
 ensureStation03Experience(restored,[]);
 assert.deepEqual(restored.station03Experience.dataChallenge,stable);
}

const scoreBefore=scoreCase(base);
for(let combination=0;combination<64;combination++){
 const record=structuredClone(base),policy=record.station03Experience;
 const act=(action,id,value)=>recordInvestigation(record.mission,action,id,now,policy.rows,value,policy);
 const initial=structuredClone(record.mission);
 assert.throws(()=>act('answer',policy.dataChallenge.questions[1].id,'public'));
 assert.deepEqual(record.mission,initial);
 act('begin-classification');
 assert.throws(()=>act('classify','financial-summary','restricted'));
 assert.throws(()=>act('complete'));
 let correctPoints=0;
 for(const [index,question] of policy.dataChallenge.questions.entries()){
  const options=selected[index],answer=options[Math.floor(combination/(4**index))%4];
  const previous=structuredClone(record.mission);
  assert.throws(()=>act('answer',question.id,'not-an-option'));
  assert.deepEqual(record.mission,previous);
  act('answer',question.id,answer);
  const saved=record.mission.decisions.station03.dataDecisions.answers[question.id];
  assert.equal(saved.selectedAnswer,answer);
  assert.equal(saved.confirmedAt,now);
  if(answer===expected[index])correctPoints+=policy.dataChallenge.questions.length===3?[200,200,200][index]:0;
  assert.throws(()=>act('answer',question.id,answer));
  const projection=publicMission(record),response=JSON.stringify(projection);
  for(const hidden of ['expectedAnswer','dataChallengeScore','legacyDataChallenge','classificationPoints','sharingPoints'])assert(!response.includes(hidden));
  assert.deepEqual(scoreCase(record),scoreBefore,'Global mission scoring remains unchanged');
 }
 assert.throws(()=>act('answer',policy.dataChallenge.questions[0].id,'restricted'));
 act('complete');
 const score=record.mission.decisions.station03.dataChallengeScore;
 assert.equal(score.totalPoints,correctPoints);
 assert.equal(score.maxPoints,600);
 assert.deepEqual(score.questions.map(question=>question.maxPoints),[200,200,200]);
 assert.equal(score.questions.reduce((sum,question)=>sum+question.points,0),correctPoints);
 assert.deepEqual(record.mission.evidence,base.mission.evidence);
 for(const key of ['missionId','startedAt','playerName','avatarId','hiddenScore','hiddenAttackState'])assert.equal(record.mission[key],base.mission[key]);
}

const legacy=structuredClone(base);
legacy.mission.decisions.station03={
 phase:'classification',
 dataDecisions:{'old-scenario':{scenarioId:'old-scenario',classification:{selectedClassification:'restricted',confirmedAt:now},sharing:{selectedRoleId:'financeManager',confirmedAt:now}}},
 dataChallengeScore:{version:1,totalPoints:100,maxPoints:400}
};
legacy.station03Experience.dataChallenge={version:1,scenarios:[{id:'old-scenario',expectedClassification:'restricted',expectedRoleId:'financeManager'}]};
ensureStation03Experience(legacy,[]);
assert.equal(legacy.station03Experience.dataChallenge.version,2);
assert.equal(legacy.mission.decisions.station03.legacyDataChallenge.challenge.version,1);
assert.equal(legacy.mission.decisions.station03.legacyDataChallenge.decisions['old-scenario'].classification.selectedClassification,'restricted');
assert(!JSON.stringify(publicMission(legacy)).includes('legacyDataChallenge'));
assert(!legacy.mission.decisions.station03.dataDecisions);
const unclaimed=structuredClone(base);
unclaimed.mission.decisions={};
unclaimed.station03Experience.dataChallenge={version:1,scenarios:[{id:'unclaimed-old',expectedClassification:'restricted',expectedRoleId:'financeManager'}]};
ensureStation03Experience(unclaimed,[]);
assert.equal(unclaimed.station03Experience.dataChallenge.version,2);
assert.equal(unclaimed.legacyStation03DataChallenge.challenge.version,1);
assert(!JSON.stringify(publicMission(unclaimed)).includes('legacyStation03DataChallenge'));
assert.deepEqual(scoreCase(base),scoreBefore);

console.log('Data sharing PASS: one fixed three-question scenario, hidden answer keys/private 600-point score, all 64 answer combinations, ordered/idempotent validation, version-1 migration and unchanged mission scoring/evidence.');

// Resuming a valid v2 challenge must not migrate, clear, or reinterpret answers.
const resumed=structuredClone(base);
recordInvestigation(resumed.mission,'begin-classification',null,now,resumed.station03Experience.rows,null,resumed.station03Experience);
const first=resumed.station03Experience.dataChallenge.questions[0];
recordInvestigation(resumed.mission,'answer',first.id,now,resumed.station03Experience.rows,first.options[0].id,resumed.station03Experience);
const resumeSnapshot=structuredClone(resumed);
ensureStation03Experience(resumed,[]);
assert.deepEqual(resumed,resumeSnapshot);
assert.equal(resumed.mission.decisions.station03.dataDecisions.answers[first.id].selectedAnswer,first.options[0].id);
console.log('PASS: valid in-progress version-2 challenge and answers remain byte-for-byte equivalent after recovery.');
