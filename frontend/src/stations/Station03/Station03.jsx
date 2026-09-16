import MissionHeader from "../../components/MissionHeader/MissionHeader.jsx";
import MissionProgress from "../../components/MissionProgress/MissionProgress.jsx";
import { getStation03Scenario } from "../../utils/scenarioSelector.js";

export default function Station03({ mission }) {
  const scenarioPath = getStation03Scenario(mission);

  return (
    <main className="screen station-screen">
      <MissionHeader mission={mission} />
      <MissionProgress currentStation={3} />
      <section className="status-panel">
        <p className="eyebrow">Station 03 / 04</p>
        <h1>Digital Investigation</h1>
        <p>Development pending. Scenario path prepared: {scenarioPath}.</p>
      </section>
    </main>
  );
}
