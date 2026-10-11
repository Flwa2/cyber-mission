import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CASES} from '../../backend/src/caseDefinitions.js';
import {caseCatalog} from '../../backend/src/caseEngine.js';
import {financeTemplate} from '../../backend/src/station03Cases.js';
import {ensureStation03Experience} from '../../backend/src/station03Experience.js';
import {NARRATIVE_CHARACTERS} from '../../shared/narrativeCharacters.mjs';

const server=await createServer({configLoader:'native',root:fileURLToPath(new URL('../',import.meta.url)),server:{middlewareMode:true,watch:null},appType:'custom'});
try{
 const {default:Window}=await server.ssrLoadModule('/src/stations/Station03/WorkstationWindow.jsx');
 const {default:Document}=await server.ssrLoadModule('/src/stations/Station03/CorporateDocument.jsx');
 const {LanguageProvider}=await server.ssrLoadModule('/src/locales/LanguageProvider.jsx');
 const {workstationRecord}=await server.ssrLoadModule('/src/stations/Station03/workstationPresentation.js');
 let views=0;
 for(const definition of CASES){
  const mission={missionId:'CM-READABLE',startedAt:'2026-10-07T10:00:00Z',decisions:{station01:{},station02:{items:{}}},evidence:[],narrativeAssignment:{version:1,assignedAt:'fixture',associatedPersonId:'huda',scenarioId:'document-link',choices:['huda','fahad','mohammed'].map(id=>NARRATIVE_CHARACTERS.find(p=>p.id===id))}};
  const record={stage:3,mission,caseAssignment:{definition,...(definition.id==='case-03'?{station03:financeTemplate(definition)}:{})}};
  ensureStation03Experience(record,caseCatalog(record));
  for(const language of ['en','ar']){
   const display=value=>value&&typeof value==='object'?value[language]||value.en:value;
   const wrap=element=>renderToStaticMarkup(React.createElement(LanguageProvider,{language},element));
   for(const app of ['mail','logs','devices']){
    const records=record.station03Experience.rows.filter(r=>r.source===app).map(workstationRecord);
    const html=wrap(React.createElement(Window,{win:{id:app,slot:0,itemId:records[0]?.id},active:true,records,selected:[],apps:[],title:app,display,stamp:value=>value,appName:value=>value}));
    assert(!/WS-\d+|PL-85|FN-63|HR-18|OP-42|identityVersion|readablePresentation|\[object Object\]/.test(html));
    if(app==='logs')assert(html.includes(language==='en'?'computer':'جهاز'));
    views++;
   }
   const directory=workstationRecord(record.station03Experience.rows.find(r=>r.id==='case:directory'));
   const html=wrap(React.createElement(Document,{document:directory}));
   assert(html.includes(language==='en'?'Huda':'هدى'));assert(!/WS-\d+|readablePresentation/.test(html));views++;
  }
 }
 console.log(`Readable evidence render PASS: ${views} Arabic/English mail, log, device and document views; localized values render without technical codes or object errors.`);
}finally{await server.close();}
