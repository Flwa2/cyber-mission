import { useEffect, useRef, useState } from "react";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen.jsx";
import { MissionProvider, useMission } from "./context/MissionContext.jsx";
import FinalResult from "./pages/FinalResult/FinalResult.jsx";
import Welcome from "./pages/Welcome/Welcome.jsx";
import StationWaitingScreen from "./components/StationWaitingScreen/StationWaitingScreen.jsx";
import Station01 from "./stations/Station01/Station01.jsx";
import Station02 from "./stations/Station02/Station02.jsx";
import Station03 from "./stations/Station03/Station03.jsx";
import Station04 from "./stations/Station04/Station04.jsx";
import { STATION_STATUS } from "./utils/stationStatus.js";

function MissionRouter() {
  const { mission, isLoaded, startMission } = useMission();

  const [launching, setLaunching] = useState(false);
  const launchLock = useRef(false);
  useEffect(() => {
    if (!launching) return;
    const timeout = window.setTimeout(() => setLaunching(false), 650);
    return () => window.clearTimeout(timeout);
  }, [launching]);
  useEffect(() => { if (!mission) launchLock.current = false; }, [mission]);
  function launchMission() {
    if (launchLock.current) return;
    launchLock.current = true;
    startMission();
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
    return <Welcome onStartMission={launchMission} />;
  }

  if (mission.status === "complete") {
    return <FinalResult mission={mission} />;
  }

  switch (mission.currentStation) {
    case 1:
      return <>
        <Station01 mission={mission} />
        {launching && <Welcome launching />}
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
        {launching && <Welcome launching />}
      </>;
  }
}

export default function App() {
  return (
    <MissionProvider>
      <MissionRouter />
    </MissionProvider>
  );
}
