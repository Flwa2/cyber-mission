import MissionTimer from "../../components/MissionTimer/MissionTimer.jsx";
import QRDisplay from "../../components/QRDisplay/QRDisplay.jsx";

export default function StationComplete({ mission }) {
  return (
    <section className="station-complete-card">
      <div className="complete-signal" aria-hidden="true">
        <span />
      </div>

      <div className="complete-copy">
        <p className="eyebrow">Station 01</p>
        <h2>Complete</h2>
        <strong>Decision Recorded</strong>
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
          <strong>02 The Desk</strong>
        </div>
      </div>

      <div className="handoff-panel">
        <span>Proceed to Station 02</span>
        <strong>The Desk</strong>
        <p>Move to the next physical screen and continue with the same Mission ID.</p>
      </div>

      <QRDisplay missionId={mission.missionId} />
    </section>
  );
}
