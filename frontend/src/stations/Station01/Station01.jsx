import MissionHeader from "../../components/MissionHeader/MissionHeader.jsx";
import MissionProgress from "../../components/MissionProgress/MissionProgress.jsx";
import MissionTimer from "../../components/MissionTimer/MissionTimer.jsx";
import QRDisplay from "../../components/QRDisplay/QRDisplay.jsx";

export default function Station01({ mission }) {
  return (
    <main className="screen station-screen">
      <MissionHeader mission={mission} />
      <MissionProgress currentStation={1} />

      <section className="station-layout">
        <div className="station-intro">
          <p className="eyebrow">Station 01 / 04</p>
          <h2>Suspicious Message</h2>
          <p>
            The interactive message investigation will be built in the next phase. This station is ready to receive dynamic scenarios.
          </p>
        </div>

        <div className="station-console">
          <div className="console-row">
            <span>Mission ID</span>
            <strong>{mission.missionId}</strong>
          </div>
          <div className="console-row">
            <MissionTimer startedAt={mission.startedAt} />
          </div>
          <div className="console-row">
            <span>Status</span>
            <strong>Investigation Ready</strong>
          </div>
          <QRDisplay missionId={mission.missionId} />
        </div>
      </section>
    </main>
  );
}
