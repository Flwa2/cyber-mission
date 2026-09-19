import { useEffect, useRef } from "react";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./MissionBriefing.css";

export default function MissionBriefing({ mission, onBegin, onBack }) {
  const title = useRef(null);
  useEffect(() => { title.current?.focus(); }, []);
  return <main className="mission-briefing" aria-labelledby="briefing-title">
    <header className="briefing-chrome">
      <CyberMissionBrand variant="compact" />
      <div className="briefing-chrome-right">
        <div className="briefing-mission-id"><span>MISSION ID</span><strong>{mission.missionId}</strong></div>
        <FullscreenButton />
      </div>
    </header>
    <section className="briefing-content">
      <div className="briefing-intro">
        <p className="briefing-incident"><i aria-hidden="true" /> CYBER BREACH / ACTIVE INCIDENT</p>
        <h1 id="briefing-title" tabIndex={-1} ref={title}>MISSION <span>BRIEFING</span></h1>
        <p className="briefing-lead">A cyber incident is unfolding.<br />Your decisions will determine what happens next.</p>
      </div>
      <div className="briefing-operation">
        <div className="briefing-facts">
          <div><strong>04</strong><span>CONNECTED STATIONS</span></div>
          <div><strong>{formatTimer(GAME_CONFIG.missionDurationSeconds)}</strong><span>TOTAL MISSION TIME</span></div>
          <div><strong>ONE</strong><span>CONNECTED INCIDENT</span></div>
        </div>
        <div className="briefing-route" aria-label="4 connected stations, all prepared">
          <ol>{[1, 2, 3, 4].map(number => <li key={number}><span>0{number}</span><small>PREPARED</small></li>)}</ol>
        </div>
      </div>
      <div className="briefing-guidance">
        <div><h2>YOUR DECISIONS CARRY FORWARD</h2><p>What you do in one station may affect what happens next.</p></div>
        <div><h2>THINK BEFORE YOU ACT</h2><p>Once a decision is confirmed, the mission moves forward.</p></div>
      </div>
      <footer className="briefing-footer">
        <button className="briefing-back" type="button" onClick={onBack}><span aria-hidden="true">←</span> BACK</button>
        <div className="briefing-start"><p>THE TIMER STARTS WHEN YOU BEGIN</p><button className="briefing-begin" type="button" onClick={onBegin}>BEGIN MISSION <span aria-hidden="true">→</span></button></div>
      </footer>
    </section>
  </main>;
}
