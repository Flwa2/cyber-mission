import MissionTimer from "../../components/MissionTimer/MissionTimer.jsx";

export default function StationComplete({ mission }) {
  return (
    <section className="station-complete-card" aria-label="Station 01 complete">
      <div className="handoff-scan" aria-hidden="true" />
      <div className="complete-signal" aria-hidden="true"><span /></div>
      <div className="complete-copy">
        <p className="eyebrow">Station 01</p>
        <h2>Complete</h2>
        <strong>Decision Recorded</strong>
      </div>
      <div className="completion-meta">
        <span>MISSION <strong>{mission.missionId}</strong></span>
        <span aria-hidden="true">&bull;</span>
        <MissionTimer startedAt={mission.startedAt} label="Time" />
      </div>
      <div className="handoff-panel">
        <span className="handoff-label">Next Station</span>
        <div className="handoff-destination"><span>02</span><strong>The Desk</strong></div>
        <p className="handoff-instruction">Proceed to Station 02 <span aria-hidden="true">&rarr;</span></p>
        <p>Continue the investigation on the next device.</p>
      </div>
    </section>
  );
}
