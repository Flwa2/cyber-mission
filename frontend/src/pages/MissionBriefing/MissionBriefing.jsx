import { useEffect, useRef } from "react";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { SHOW_MISSION_ID } from "../../config/presentationConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./MissionBriefing.css";

const steps = [
  ["details", "INVESTIGATE", "Check what you see."],
  ["actions", "DECIDE", "Choose your response."],
  ["continue", "MOVE FORWARD", "Your choice affects what comes next."]
];
export default function MissionBriefing({ mission, onBegin, onBack }) {
  const title = useRef(null);
  const duration = formatTimer(GAME_CONFIG.missionDurationSeconds);
  useEffect(() => { title.current?.focus(); }, []);
  return <main className="mission-briefing" aria-labelledby="briefing-title">
    <header className="briefing-chrome">
      <CyberMissionBrand variant="compact" />
      <div className="briefing-chrome-right">
        {SHOW_MISSION_ID && <div className="briefing-mission-id"><span>MISSION ID</span><strong>{mission.missionId}</strong></div>}
        <FullscreenButton />
      </div>
    </header>
    <div className="briefing-content">
      <section className="briefing-intro">
        <p className="briefing-eyebrow">BEFORE YOU BEGIN</p>
        <h1 id="briefing-title" tabIndex={-1} ref={title}>MISSION <span>BRIEFING</span></h1>
        <p className="briefing-summary">4 challenges. 8 minutes. One connected incident.</p>
      </section>
      <ol className="briefing-steps" aria-label="How to play">{steps.map(([icon, heading, copy], index) => <li key={heading}>
        <div className="briefing-step-symbol"><span>0{index + 1}</span><div className="briefing-icon-ring"><MissionIcon name={icon} /></div></div>
        <h2>{heading}</h2><p>{copy}</p>
      </li>)}</ol>
      <section className="briefing-route" aria-label="4 connected challenges">
        <h2>4 CONNECTED CHALLENGES</h2>
        <ol>{[1, 2, 3, 4].map(number => <li key={number}><span>0{number}</span></li>)}</ol>
      </section>
      <div className="briefing-start">
        <div className="briefing-timer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="14" r="8" /><path d="M12 6V2M9 2h6M18 7l2-2M12 10v5l3 2" /></svg>
          <div className="briefing-duration"><strong>{duration}</strong><span>TOTAL TIME</span></div>
          <p>The timer starts when you begin.</p>
        </div>
        <button className="briefing-begin" type="button" onClick={onBegin}>BEGIN MISSION <span aria-hidden="true">&rarr;</span></button>
      </div>
      <button className="briefing-back" type="button" onClick={onBack}><span aria-hidden="true">&larr;</span> BACK TO HOME</button>
    </div>
  </main>;
}
