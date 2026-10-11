import { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { normalizeLanguage } from '../../../shared/language.mjs';
import { translate } from './translate.js';
import './language.css';
const LanguageContext=createContext({language:'ar',t:value=>translate(value,'ar')});
export function LanguageProvider({language,children}){
 const normalized=normalizeLanguage(language);
 const context=useMemo(()=>({language:normalized,t:value=>translate(value,normalized)}),[normalized]);
 useLayoutEffect(()=>{document.documentElement.lang=normalized;document.documentElement.dir=normalized==='ar'?'rtl':'ltr';},[normalized]);
 return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}
export const useTranslation=()=>useContext(LanguageContext);
