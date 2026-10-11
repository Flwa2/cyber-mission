import ar from './ar.js';
import en from './en.js';
import casesAr from './cases.js';
import scenarioAr from './scenarios.ar.js';
import { ar as investigationAr, en as investigationEn } from './station03.js';
import { normalizeLanguage } from '../../../shared/language.mjs';
const resources = {...ar, ...scenarioAr, ...investigationAr, ...casesAr};
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(resources).filter(([key])=>/\{\w+\}/.test(key)).map(([key,value])=>{
 const names=[...key.matchAll(/\{(\w+)\}/g)].map(match=>match[1]);
 return {pattern:new RegExp('^'+key.split(/\{\w+\}/).map(escape).join('(.+?)')+'$'),names,value};
});
export function translate(value, language='ar') {
 if(typeof value!=='string')return value;
 if(normalizeLanguage(language)==='en')return investigationEn[value]||en[value]||value;
 if(resources[value])return resources[value];
 for(const {pattern,names,value:translation} of templates){
  const match=value.match(pattern);if(match){const variables=Object.fromEntries(names.map((name,i)=>[name,translate(match[i+1],language)]));return translation.replace(/\{(\w+)\}/g,(_,key)=>variables[key]);}
 }
 return value;
}
// Presentation-only copies. Never write localized values back to mission state.
export function localizeDisplay(value, language){
 if(Array.isArray(value))return value.map(item=>localizeDisplay(item,language));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,localizeDisplay(item,language)]));
 return translate(value,language);
}
