import {renameStation03Files} from '../../../../shared/station03Filenames.mjs';
const identities={nora:{en:'Nora',ar:'نورة'},nawaf:{en:'Nawaf',ar:'نواف'},mohammed:{en:'Mohammed',ar:'محمد'},khalid:{en:'Khalid',ar:'خالد'},sara:{en:'Sara',ar:'سارة'},flwah:{en:'Falwah',ar:'فلوة'}};
const services={
 'finance-review@example.com':{en:'Finance Review',ar:'مراجعة المدفوعات'},
 'sharing@example.com':{en:'Document Services',ar:'خدمات المستندات'},
 'identity@example.com':{en:'Account Services',ar:'خدمات الحسابات'},
 'mail-settings@example.com':{en:'Mail Services',ar:'خدمات البريد'}
};
function presentationText(value){
 if(typeof value==='string')return value
  .replace(/\b(sami|mazen|reem|falwah)@example\.com\b/gi,(_,name)=>({sami:'nawaf',mazen:'khalid',reem:'sara',falwah:'flwah'}[name.toLowerCase()]+'@example.com'))
  .replace(/\bSami\b/g,'Nawaf').replace(/\bMazen\b/g,'Khalid').replace(/\bReem\b/g,'Sara')
  .replace(/سامي/g,'نواف').replace(/مازن/g,'خالد').replace(/ريم/g,'سارة')
  .replace(/^(sami|mazen|reem)_/i,(_,name)=>({sami:'nawaf',mazen:'khalid',reem:'sara'}[name.toLowerCase()]+'_'));
 if(Array.isArray(value))return value.map(presentationText);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,presentationText(item)]));
 return value;
}
export function workstationRecord(source){
 const record=renameStation03Files(source);
 // New narrative snapshots already carry the exact randomized identities.
 // Keep the legacy aliases below only for earlier saved investigations.
 if(record.metadata?.identityVersion===2||record.narrativeIdentityVersion===2){
  const {identityVersion,readablePresentation,...metadata}=record.metadata;
  return {...record,narrativeIdentityVersion:2,metadata:readablePresentation?.version===1?readablePresentation.metadata:metadata};
 }
 // Station 03 display projection only: never rename record IDs or persisted case/account keys.
 const metadata=presentationText(record.metadata);
 // Internal case correlation remains backend-owned, not document chrome.
 if(/^(FN|HR|OP|PL)-\d+$/.test(metadata.reference||''))delete metadata.reference;
 if(record.source==='mail'){
  const account=metadata.from||'',identity=identities[account.split('@')[0]];
  if(identity&&account.endsWith('@example.com'))metadata.senderName=identity;
  else if(services[account])metadata.senderName=services[account];
  else if(['team@example.com','it@example.com','news@example.com','office@example.com'].includes(account)&&metadata.senderName){
   const key=Object.keys(identities).find(key=>identities[key].en===metadata.senderName.en);
   if(key)metadata.from=`${key}@example.com`;
  }  else if(!account.endsWith('@example.com')&&!metadata.senderName){
   // External addresses are investigation facts, not synthetic first-name aliases.
   metadata.senderName={en:'Notifications',ar:'الإشعارات'};
  }
 }
 return {...record,title:presentationText(record.title),description:presentationText(record.description),metadata};
}
