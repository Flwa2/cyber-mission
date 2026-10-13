import {conversationFor} from './station04Conversations.js';
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
 const fallback=[{en:'the account owner',ar:'صاحب الحساب'},{en:'a colleague',ar:'زميل'},{en:'the reviewer',ar:'المراجع'}];
 const pick=i=>people[i]?.name||fallback[i];
 const conversations=conversationFor(definition.id,{a:pick(0),b:pick(1),c:pick(2)}); if(!conversations)throw new Error('Archive case is unavailable');
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
  references:{documents:(sources.documents||[sources.document]).filter(Boolean).map(source),document:primary?source(primary):null,email:null},
  ...((state.hintLevel||0)>=2?{hintRule:record.vaultAssignment.contentVersion>=2?{en:vaultRule(record.vaultAssignment.ruleId).en,ar:vaultRule(record.vaultAssignment.ruleId).ar}:{en:'Leave out the first two digits of the review reference.',ar:'احذف أول رقمين من مرجع المراجعة.'}}:{}),
  ...(state.unlockedAt?{discovery:structuredClone(state.discovery)}:{}),
  ...(state.revealedAt?{revealedCode:record.vaultAssignment.code}:{})};
}
