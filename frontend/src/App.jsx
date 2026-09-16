import LoadingScreen from "./components/LoadingScreen/LoadingScreen.jsx";
import { MissionProvider, useMission } from "./context/MissionContext.jsx";
import FinalResult from "./pages/FinalResult/FinalResult.jsx";
import Welcome from "./pages/Welcome/Welcome.jsx";
import Station01 from "./stations/Station01/Station01.jsx";
import Station02 from "./stations/Station02/Station02.jsx";
import Station03 from "./stations/Station03/Station03.jsx";
import Station04 from "./stations/Station04/Station04.jsx";

function MissionRouter() {
  const { mission, isLoaded, startMission } = useMission();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!mission) {
    return <Welcome onStartMission={startMission} />;
  }

  if (mission.status === "complete") {
    return <FinalResult mission={mission} />;
  }

  switch (mission.currentStation) {
    case 1:
      return <Station01 mission={mission} />;
    case 2:
      return <Station02 mission={mission} />;
    case 3:
      return <Station03 mission={mission} />;
    case 4:
      return <Station04 mission={mission} />;
    default:
      return <Station01 mission={mission} />;
  }
}

export default function App() {
  return (
    <MissionProvider>
      <MissionRouter />
    </MissionProvider>
  );
}
