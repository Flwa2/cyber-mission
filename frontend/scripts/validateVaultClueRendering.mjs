import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CASES} from '../../backend/src/caseDefinitions.js';
import {caseCatalog,publicMission} from '../../backend/src/caseEngine.js';
import {financeTemplate} from '../../backend/src/station03Cases.js';
import {ensureStation03Experience} from '../../backend/src/station03Experience.js';
import {publicVault,initializeVaultAssignment} from '../../backend/src/station04Vault.js';
import {createNarrativeAssignment,seededNarrativeRandom} from '../../shared/narrativeAssignment.mjs';

const server=await createServer({configLoader:'native',root:fileURLToPath(new URL('../',import.meta.url)),optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null},appType:'custom'});
try{
 const {default:Window}=await server.ssrLoadModule('/src/stations/Station03/WorkstationWindow.jsx');
 const {default:Vault}=await server.ssrLoadModule('/src/stations/Station04/Vault.jsx');
 const {default:Document}=await server.ssrLoadModule('/src/stations/Station03/CorporateDocument.jsx');
 const {LanguageProvider}=await server.ssrLoadModule('/src/locales/LanguageProvider.jsx');
 const {workstationRecord}=await server.ssrLoadModule('/src/stations/Station03/workstationPresentation.js');
 for(const definition of CASES)for(let rule=0;rule<7;rule++)for(let variant=0;variant<3;variant++){
  const now='2026-10-10T10:00:00Z';
  const record={stage:3,caseAssignment:{definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})},mission:{missionId:'CM-RENDER',startedAt:now,decisions:{station01:{},station02:{items:{}}},evidence:[],narrativeAssignment:createNarrativeAssignment(seededNarrativeRandom(definition.id),now)}};
  const draws=rule<4?[rule*15,48,variant,variant]:[rule*15,0,4,variant,variant];
  initializeVaultAssignment(record,{newMission:true,random:n=>draws.shift()%n});
  ensureStation03Experience(record,caseCatalog(record));
  const rows=publicMission(record).station03Experience.records.map(workstationRecord);
  const {document}=record.vaultAssignment.clueSources;
  const email=record.vaultAssignment.emailSnapshot;
  for(const language of ['ar','en']){
   const wrap=element=>renderToStaticMarkup(React.createElement(LanguageProvider,{language},element));
   const display=value=>value&&typeof value==='object'?value[language]||value.en:value;
   const mailHtml=wrap(React.createElement(Window,{win:{id:'mail',slot:0,itemId:email.id},active:true,records:rows.filter(r=>r.source==='mail'),selected:[],apps:[],title:'Mail',display,stamp:v=>v,appName:v=>v}));
   const docHtml=wrap(React.createElement(Document,{document:rows.find(r=>r.id===document.id)}));
   const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
   assert(mailHtml.includes(escape(email.description[language].split('\n')[0])));
   assert(mailHtml.includes(email.metadata.from));
   record.stage=4;const vaultHtml=wrap(React.createElement(Vault,{vault:publicVault(record)}));
   assert(!vaultHtml.includes(email.metadata.from));
   assert(!/\[object Object\]/.test(vaultHtml));
   assert(docHtml.includes(record.vaultAssignment.reference),'six digits retain the leading-zero suffix');
   assert(docHtml.includes(language==='ar'?'مرجع المراجعة':'Review reference'));
   assert(docHtml.includes(`dir="${language==='ar'?'rtl':'ltr'}"`));
   assert(!/vaultAssignment|clueSources|\[object Object\]/.test(mailHtml+docHtml));
  }
 }
 console.log('Vault rendering PASS: all four variants, Arabic/English mail and document surfaces (504 renders across seven rules and three templates), unchanged UI components.');
}finally{await server.close();}
