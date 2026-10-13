import assert from 'node:assert/strict';
import {CASES} from '../src/caseDefinitions.js';
import {conversationFor} from '../src/station04Conversations.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';

const TOKENS={'case-01':['WS-27','share-files.example.net'],'case-02':['HR-18','Account_Update.zip','archive@review-mail.example.net'],'case-03':['FN-63','WS-09','review@vendor-copy.example.org'],'case-04':['PL-85','WS-31']};
const now=new Date().toISOString();
for(const definition of CASES){
 const positions=new Set();const bodies=new Set();
 for(let n=0;n<60;n++){
  const a=createNarrativeAssignment(seededNarrativeRandom(`${definition.id}:${n}`),now);
  const [x,y,z]=a.choices.map(p=>p.name);
  const c=conversationFor(definition.id,{a:x,b:y,c:z});
  positions.add(a.choices.findIndex(p=>p.id===a.associatedPersonId));
  for(const lang of ['en','ar']){
   const text=c[lang].join('\n');
   for(const p of a.choices)assert(text.includes(p.name[lang]),`${definition.id} ${lang} names every suspect`);
   assert(c[lang].length>=6,'a real beginning, middle and end');
   assert(!/responsible|culprit|guilty|confess|مذنب|مسؤول عن|اعتراف/i.test(text),'no verdict');
   assert(!/[\u4e00-\u9fff]/.test(text));
   assert.equal(c[lang][0].startsWith(`${[x,y,z].map(p=>p[lang]).find(s=>c[lang][0].startsWith(s+':'))}:`),true,'speaker prefix');
  }
  for(const t of TOKENS[definition.id]){assert(c.en.join('\n').includes(t)&&c.ar.join('\n').includes(t),`${definition.id} keeps ${t}`);}
  // The wording must not depend on which suspect is the correct one.
  bodies.add(c.en.map(l=>l.replace(/^[^:]+:/,'')).join('|')+c.ar.map(l=>l.replace(/^[^:]+:/,'')).join('|'));
 }
 assert.equal(bodies.size,1,`${definition.id} text is identical across identities`);
 assert.equal(positions.size,3,`${definition.id}: the correct suspect appears in every speaking position`);
}
console.log('Recovered conversations PASS: 4 cases x 60 seeds, role-neutral text, all suspect positions, no verdict, required evidence tokens, bilingual.');
