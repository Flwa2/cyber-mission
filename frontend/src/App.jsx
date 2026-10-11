import {INDEPENDENT_MODE} from './booth/playMode.js';
import IndependentSession from './booth/IndependentSession.jsx';
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DEV_STATION03_PREVIEW, DEV_STATION04_PREVIEW } from './config/developmentConfig.js';
import LoadingScreen from "./components/LoadingScreen/LoadingScreen.jsx";
import { MissionProvider, useMission } from "./context/MissionContext.jsx";
import FinalResult from "./pages/FinalResult/FinalResult.jsx";
import Welcome from "./pages/Welcome/Welcome.jsx";
import PlayerSetup from "./pages/PlayerSetup/PlayerSetup.jsx";
import MissionBriefing from "./pages/MissionBriefing/MissionBriefing.jsx";
import StationWaitingScreen from "./components/StationWaitingScreen/StationWaitingScreen.jsx";
import Station01 from "./stations/Station01/Station01.jsx";
import Station02 from "./stations/Station02/Station02.jsx";
import Station03 from "./stations/Station03/Station03.jsx";
import Station04 from "./stations/Station04/Station04.jsx";
import { STATION_STATUS } from "./utils/stationStatus.js";
import { stationNumber } from "./booth/boothApi.js";
import StationOneSync from "./booth/StationOneSync.jsx";
import StationDevice from "./booth/StationDevice.jsx";
import Recovery from "./booth/Recovery.jsx";
import { LanguageProvider, useTranslation } from './locales/LanguageProvider.jsx';

// Vite removes these imports and preview fixtures from production builds.
const Station04DevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/Station04DevPreview.jsx')) : null;
const Station03DevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/Station03DevPreview.jsx')) : null;

function MissionRouter() {
 const {mission}=useMission();
 const [selectedLanguage,setSelectedLanguage]=useState('ar');
 useEffect(()=>{if(!mission)setSelectedLanguage('ar');},[mission]);
 return <LanguageProvider language={mission?mission.language:selectedLanguage}><MissionRouterContent selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage}/></LanguageProvider>;
}
function MissionRouterContent({selectedLanguage,onLanguageChange}) {
  const {t}=useTranslation();
  const { mission, isLoaded, prepareMission, beginMission, cancelPreparation } = useMission();

  const [showBriefing, setShowBriefing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const launchLock = useRef(false);
  useEffect(() => {
    if (!launching) return;
    const timeout = window.setTimeout(() => setLaunching(false), 650);
    return () => window.clearTimeout(timeout);
  }, [launching]);
  useEffect(() => {
    if (!mission) {
      launchLock.current = false;
      setShowBriefing(false);
    }
  }, [mission]);
  function launchMission() {
    if (launchLock.current) return;
    launchLock.current = true;
    beginMission();
    setLaunching(true);
  }

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const previewStation = Number(params.get("stationPreview"));
    const previewStatus = params.get("status")?.toUpperCase();

    if (previewStation && Object.values(STATION_STATUS).includes(previewStatus)) {
      return <StationWaitingScreen mission={mission} stationNumber={previewStation} status={previewStatus} />;
    }
  }

  if (!mission) {
    return <Welcome onStartMission={()=>prepareMission(selectedLanguage)} onLanguageChange={onLanguageChange} />;
  }

  if (mission.status === "prepared") {
    if (!showBriefing) {
      return <PlayerSetup mission={mission} onContinue={() => setShowBriefing(true)} onBack={cancelPreparation} />;
    }
    return <MissionBriefing mission={mission} onBegin={launchMission} onBack={() => setShowBriefing(false)} />;
  }

  if (mission.status === "complete") {
    return <FinalResult mission={mission} />;
  }

  // Physical booth URLs stay on their configured station; server handoff does
  // not authorize local navigation into an unclaimed downstream station.
  switch (stationNumber) {
    case 1:
      return <>
        <Station01 mission={mission} />
        {launching && <div className="briefing-launch" role="status">{t('INCIDENT RESPONSE INITIATED')}</div>}
      </>;
    case 2:
      return <Station02 mission={mission} />;
    case 3:
      return <Station03 mission={mission} />;
    case 4:
      return <Station04 mission={mission} />;
    default:
      return <>
        <Station01 mission={mission} />
        {launching && <div className="briefing-launch" role="status">{t("INCIDENT RESPONSE INITIATED")}</div>}
      </>;
  }
}

export default function App() {
  if (DEV_STATION03_PREVIEW) return <Suspense fallback={null}><Station03DevPreview /></Suspense>;
  if (DEV_STATION04_PREVIEW) return <Suspense fallback={null}><Station04DevPreview /></Suspense>;
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("recovery")) return <Recovery />;
  if (INDEPENDENT_MODE) return <MissionProvider><IndependentSession setup={<MissionRouter/>}/></MissionProvider>;
  if (stationNumber > 1) return <StationDevice />;
  return (
    <MissionProvider>
      <MissionRouter />
      <StationOneSync />
    </MissionProvider>
  );
}
