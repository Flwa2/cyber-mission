import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CASES} from '../../backend/src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../../backend/src/caseEngine.js';
import {financeTemplate} from '../../backend/src/station03Cases.js';
import {ensureStation03Experience} from '../../backend/src/station03Experience.js';
import {initializeVaultAssignment} from '../../backend/src/station04Vault.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';

const server=await createServer({configLoader:'native',root:fileURLToPath(new URL('../',import.meta.url)),optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null},appType:'custom'});
try{
 const {default:Window}=await server.ssrLoadModule('/src/stations/Station03/WorkstationWindow.jsx');
 const {default:Document}=await server.ssrLoadModule('/src/stations/Station03/CorporateDocument.jsx');
 const {LanguageProvider}=await server.ssrLoadModule('/src/locales/LanguageProvider.jsx');
 const {workstationRecord}=await server.ssrLoadModule('/src/stations/Station03/workstationPresentation.js');
 for(const definition of CASES){
  const now='2026-10-10T10:00:00Z';
  const record={stage:3,caseAssignment:{definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:'CM-RENDER',startedAt:now,decisions:{station01:{},station02:{items:{}}},evidence:[],narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(definition.id),now)}};
  initializeVaultAssignment(record,{newMission:true,random:()=>7});
  ensureStation03Experience(record,caseCatalog(record));
  const rows=publicMission(record).station03Experience.records.map(workstationRecord);
  const {email,document}=record.vaultAssignment.clueSources;
  for(const language of ['ar','en']){
   const wrap=element=>renderToStaticMarkup(React.createElement(LanguageProvider,{language},element));
   const display=value=>value&&typeof value==='object'?value[language]||value.en:value;
   const mailHtml=wrap(React.createElement(Window,{win:{id:'mail',slot:0,itemId:email.id},active:true,records:rows.filter(r=>r.source==='mail'),selected:[],apps:[],title:'Mail',display,stamp:v=>v,appName:v=>v}));
   const docHtml=wrap(React.createElement(Document,{document:rows.find(r=>r.id===document.id)}));
   assert(mailHtml.includes(language==='ar'?'بعد حذف أول رقمين':'leaving out the first two digits'));
   assert(docHtml.includes('170007'),'six digits retain the leading-zero suffix');
   assert(docHtml.includes(language==='ar'?'مرجع المراجعة':'Review reference'));
   assert(docHtml.includes(`dir="${language==='ar'?'rtl':'ltr'}"`));
   assert(!/vaultAssignment|clueSources|\[object Object\]/.test(mailHtml+docHtml));
  }
 }
 console.log('Vault rendering PASS: all four variants, Arabic/English mail and document surfaces (16 renders), unchanged UI components.');
}finally{await server.close();}
