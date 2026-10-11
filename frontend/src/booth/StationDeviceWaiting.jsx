import {useTranslation} from '../locales/LanguageProvider.jsx';
import {GAME_CONFIG} from '../config/gameConfig.js';

// The original Station02 terminal presentation, shared by every receiving device.
export default function StationDeviceWaiting({station}){
 const {t,language}=useTranslation();
 const number=String(station).padStart(2,'0'),previous=String(station-1).padStart(2,'0');
 return <>
  <h1>{t('STATION')} {number} {t('READY')}</h1>
  <p className="booth-waiting-message">{language==='ar'?`بانتظار اكتمال المحطة ${previous} لاستقبال المشارك التالي.`:`Waiting for Station ${previous} to finish for the next participant.`}</p>
  <ol className="booth-station-flow" aria-label={t('Booth station flow')}>
   {[1,2,3,4].map(number=><li key={number} aria-current={number===station?'location':undefined}><span className="booth-flow-number">0{number}</span>{number===station&&<span className="booth-flow-current">{t('CURRENT STATION')}</span>}</li>)}
  </ol>
  <p className="booth-waiting-help">{t('This station will start automatically when the next mission is ready.')}</p>
 </>;
}
export function waitingStationTitle(station,t){return t(GAME_CONFIG.stationNames[station]);}
