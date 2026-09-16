import MissionTimer from "../../components/MissionTimer/MissionTimer.jsx";
import QRDisplay from "../../components/QRDisplay/QRDisplay.jsx";

export default function StationComplete({ mission }) {
  return (
    <section className="station-complete-card">
      <div>
        <p className="eyebrow">Station 01 Complete</p>
        <h2>Decision Recorded</h2>
        <p>Continue your investigation at Station 02.</p>
      </div>

      <div className="completion-grid">
        <div>
          <span>Mission ID</span>
          <strong>{mission.missionId}</strong>
        </div>
        <div>
          <MissionTimer startedAt={mission.startedAt} />
        </div>
        <div>
          <span>Next Station</span>
          <strong>02 / The Desk</strong>
        </div>
      </div>

      <QRDisplay missionId={mission.missionId} />
    </section>
  );
}

