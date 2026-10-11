import {scoreFinancial} from './progressiveScoring.js';
import {text} from '../../shared/casePeople.mjs';

const scenarioId='financial-data-sharing';

const classificationOptions=[
 {id:'public',label:text('Public','عام.')},
 {id:'restricted',label:text('Restricted','مقيد.')},
 {id:'secret',label:text('Confidential','سري.')},
 {id:'top-secret',label:text('Top Secret','سري للغاية.')}
];

function buildQuestions(timestamp){
 const receivedAt=minutes=>new Date(Date.parse(timestamp)-minutes*60000).toISOString();
 return [
  {
   id:'q1-public-classification',
   prompt:text('What data classification level allows data to be shared outside the Fund without an agreement?','ما هو مستوى تصنيف البيانات الذي يسمح بمشاركة البيانات خارج الصندوق بدون اتفاقية؟'),
   context:{
    sender:text('Data & Compliance Office','مكتب البيانات والالتزام'),
    from:'data.office@environment-fund.invalid',
    subject:text('Request to share programme information','طلب مشاركة معلومات البرنامج'),
    receivedAt:receivedAt(12),
    body:text('Hello, our partner-relations team has received a request for general programme information ahead of a joint briefing. Could you advise what may be shared before a data-sharing agreement is in place?','مرحبًا، تلقى فريق علاقات الشركاء طلبًا للحصول على معلومات عامة عن البرنامج قبل إحاطة مشتركة. هل يمكنكم إفادتنا بما يمكن مشاركته قبل إبرام اتفاقية لمشاركة البيانات؟')
   },
   options:classificationOptions,
   expectedAnswer:'public'
  },
  {
   id:'q2-request-external-data',
   prompt:text('Your department has an active project and needs data from an external organization. Which department is responsible for requesting data from outside the Fund?','لدى إدارتك مشروع قائم ولإتمامه تحتاج إلى بيانات من جهة خارجية. من الإدارة المسؤولة عن طلب البيانات من جهات خارج الصندوق؟'),
   context:{
    sender:text('Project Coordination Team','فريق تنسيق المشروع'),
    from:'projects@environment-fund.invalid',
    subject:text('Data needed for the active project','بيانات مطلوبة للمشروع القائم'),
    receivedAt:receivedAt(9),
    body:text('Hello, our project is underway and the next milestone depends on receiving information held by an external organization. We are preparing the request and would appreciate your guidance on the next step.','مرحبًا، بدأ العمل في مشروعنا وتعتمد المرحلة القادمة على الحصول على معلومات لدى جهة خارجية. نجهّز الطلب ونقدّر توجيهكم بشأن الخطوة التالية.')
   },
   options:[
    {id:'general-it-digital-transformation',label:text('General Administration of Information Technology and Digital Transformation','الإدارة العامة لتقنية المعلومات والتحول الرقمي.')},
    {id:'project-department',label:text('The department responsible for the project','الإدارة التي يتبع لها المشروع.')},
    {id:'data-management-office',label:text('Data Management Office','مكتب إدارة البيانات.')},
    {id:'implementing-company',label:text('The company responsible for implementing the project','الشركة المسؤولة عن تنفيذ المشروع.')}
   ],
   expectedAnswer:'data-management-office'
  },
  {
   id:'q3-trusted-friend-sharing',
   prompt:text('A trusted friend at another government entity asks for data held by your department on your work computer. How would you share it?','تواصل معك صديق تثق به من جهة حكومية أخرى وسأل عن إمكانية مشاركة بيانات تمتلكها إدارتك في الصندوق وهي موجودة على جهازك، كيف ستشاركها معه؟'),
   context:{
    sender:text('Ahmed — colleague at another government entity','أحمد — زميل في جهة حكومية أخرى'),
    from:'ahmed@partner-government.invalid',
    subject:text('A quick question','سؤال سريع'),
    receivedAt:receivedAt(5),
    body:text('Hi, we are working on a related project over here. Could you send me the dataset your department has on your work computer? It would help us move things along.','مرحبًا، نعمل هنا على مشروع ذي صلة. هل يمكنك إرسال مجموعة البيانات الموجودة لدى إدارتكم على جهاز العمل؟ سيساعدنا ذلك على إنجاز العمل.')
   },
   options:[
    {id:'whatsapp',label:text('Via WhatsApp','عن طريق تطبيق الواتساب.')},
    {id:'personal-email',label:text('Via your personal email','عن طريق إيميلك الشخصي.')},
    {id:'fund-email',label:text('Via your Fund email','عن طريق إيميلك التابع للصندوق.')},
    {id:'contact-data-management-office',label:text('Contact the Fund Data Management Office','تتواصل معه عن طريق مكتب إدارة البيانات في الصندوق.')}
   ],
   expectedAnswer:'contact-data-management-office'
  }
 ];
}

export function assignDataChallenge(timestamp){
 return {
  version:2,
  id:scenarioId,
  assignedAt:timestamp,
  title:text('Data Sharing Workshop','تمرين مشاركة البيانات'),
  document:{
   id:'financial-summary',
   filename:'Fund_Financial_Data_Summary.xlsx',
   title:text('Fund Financial Data Summary','ملخص البيانات المالية للصندوق'),
   timestamp,
   metadata:{},
   fictionalNote:text('Fictional training example. All names and figures are invented.','مثال تدريبي افتراضي. جميع الأسماء والأرقام مختلقة.'),
   description:text(
    'Project | Allocated (SAR) | Spent (SAR) | Balance (SAR) | Committed (SAR)\nCoastal Seed Bank | 420,000 | 263,500 | 156,500 | 48,500\nDune Planting Trial | 285,000 | 174,200 | 110,800 | 32,100\nNative Species Survey | 160,000 | 96,750 | 63,250 | 12,750\nTraining Garden | 95,000 | 58,400 | 36,600 | 9,000',
    'المشروع | المخصص (ريال) | المصروف (ريال) | الرصيد (ريال) | الالتزامات (ريال)\nبنك بذور الساحل | 420,000 | 263,500 | 156,500 | 48,500\nتجربة زراعة الكثبان | 285,000 | 174,200 | 110,800 | 32,100\nمسح الأنواع المحلية | 160,000 | 96,750 | 63,250 | 12,750\nحديقة التدريب | 95,000 | 58,400 | 36,600 | 9,000'
   )
  },
  questions:buildQuestions(timestamp)
 };
}

export function publicDataChallenge(challenge){
 if(!challenge||challenge.version!==2)return undefined;
 return {
  version:challenge.version,
  id:challenge.id,
  assignedAt:challenge.assignedAt,
  title:challenge.title,
  document:challenge.document,
  questions:challenge.questions.map(({id,prompt,context,options})=>({id,prompt,context,options}))
 };
}

export function recordDataDecision(station,challenge,action,itemId,value,now,missionId){
 if(action==='complete'){
  const answers=station.dataDecisions?.answers||{};
  if(station.phase!=='classification'||challenge.questions.some(question=>!answers[question.id]?.confirmedAt)){
   throw new Error('Answer all three questions first');
  }
  return;
 }
 if(action!=='answer')throw new Error('Unknown financial data decision');
 if(station.phase!=='classification')throw new Error('Finish the investigation first');

 const answers=station.dataDecisions?.answers||{};
 const next=challenge.questions.find(question=>!answers[question.id]?.confirmedAt);
 if(!next||next.id!==itemId)throw new Error('Answer the current question first');
 if(!next.options.some(option=>option.id===value))throw new Error('Choose one of the available answers');

 const saved={selectedAnswer:value,confirmedAt:now};
 station.dataDecisions={
  version:2,
  scenarioId:challenge.id,
  missionId,
  answers:{...answers,[itemId]:saved}
 };
 station.dataChallengeScore=scoreFinancial(challenge,station.dataDecisions.answers);
}
