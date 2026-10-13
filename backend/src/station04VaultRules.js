// Content-version 2 archive codes. Everything a player reads (email, document
// reference, hint 2) and the code the server accepts derive from one assignment.
const pad=(value,length)=>String(value).padStart(length,'0');
const split=reference=>[reference.slice(0,-2),Number(reference.slice(-2))];

export const VAULT_RULES=[
 {id:'first-4',length:6,apply:ref=>ref.slice(0,4),
  en:'Use the first four digits of the review reference.',ar:'استخدم أول أربعة أرقام من مرجع المراجعة.'},
 {id:'last-4',length:6,apply:ref=>ref.slice(-4),
  en:'Use the last four digits of the review reference.',ar:'استخدم آخر أربعة أرقام من مرجع المراجعة.'},
 {id:'drop-first-2',length:6,apply:ref=>ref.slice(2),
  en:'Leave out the first two digits of the review reference.',ar:'احذف أول رقمين من مرجع المراجعة.'},
 {id:'drop-last-2',length:6,apply:ref=>ref.slice(0,4),
  en:'Leave out the last two digits of the review reference.',ar:'احذف آخر رقمين من مرجع المراجعة.'},
 {id:'plus-1-last-2',length:4,apply:ref=>{const [head,tail]=split(ref);return head+pad(tail+1,2);},
  en:'Add 1 to the last two digits of the review reference and keep the first two digits.',ar:'أضف 1 إلى آخر رقمين من مرجع المراجعة مع إبقاء أول رقمين كما هما.'},
 {id:'minus-1-last-2',length:4,apply:ref=>{const [head,tail]=split(ref);return head+pad(tail-1,2);},
  en:'Subtract 1 from the last two digits of the review reference and keep the first two digits.',ar:'اطرح 1 من آخر رقمين من مرجع المراجعة مع إبقاء أول رقمين كما هما.'}
];
const ruleById=id=>VAULT_RULES.find(rule=>rule.id===id);
export const vaultRule=id=>ruleById(id);

// Last two digits must not wrap (99 + 1 or 00 - 1), so the rule stays a simple edit.
function normalize(ruleId,reference){
 if(ruleId==='plus-1-last-2'&&reference.endsWith('99'))return `${reference.slice(0,-2)}98`;
 if(ruleId==='minus-1-last-2'&&reference.endsWith('00'))return `${reference.slice(0,-2)}01`;
 return reference;
}
export const applyVaultRule=(ruleId,reference)=>ruleById(ruleId).apply(reference);

export function createVaultCodeAssignment(random){
 const pick=n=>((random(n)%n)+n)%n;
 const rule=VAULT_RULES[pick(VAULT_RULES.length)];
 const reference=normalize(rule.id,pad(pick(10**rule.length),rule.length));
 return {ruleId:rule.id,reference,code:applyVaultRule(rule.id,reference)};
}

// A different reference of the same shape that can never open the archive by the real rule.
export function decoyReference(ruleId,realReference,code,seed){
 const rule=ruleById(ruleId),space=10**rule.length;
 let value=(seed*7919+Number(code)*17)%space;
 for(let i=0;i<space;i++){
  const reference=normalize(ruleId,pad(value,rule.length));
  if(reference!==realReference&&applyVaultRule(ruleId,reference)!==code)return reference;
  value=(value+137)%space;
 }
 throw new Error('No decoy reference available');
}
