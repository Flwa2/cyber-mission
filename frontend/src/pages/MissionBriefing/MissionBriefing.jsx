import { useEffect, useRef } from "react";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./MissionBriefing.css";

const steps = [
  ["details", "INVESTIGATE", "Inspect the information before you act."],
  ["actions", "DECIDE", "Choose the response you believe is safest."],
  ["continue", "MOVE FORWARD", "Your decision is recorded and the next challenge unlocks."]
];
export default function MissionBriefing({ mission, onBegin, onBack }) {
  const title = useRef(null);
  const duration = formatTimer(GAME_CONFIG.missionDurationSeconds);
  useEffect(() => { title.current?.focus(); }, []);
  return <main className="mission-briefing" aria-labelledby="briefing-title">
    <header className="briefing-chrome">
      <CyberMissionBrand variant="compact" />
      <div className="briefing-chrome-right">
        <div className="briefing-mission-id"><span>MISSION ID</span><strong>{mission.missionId}</strong></div>
        <FullscreenButton />
      </div>
    </header>
    <div className="briefing-content">
      <section className="briefing-intro">
        <p className="briefing-eyebrow">BEFORE YOU BEGIN</p>
        <h1 id="briefing-title" tabIndex={-1} ref={title}>MISSION <span>BRIEFING</span></h1>
        <p>A cyber incident is unfolding. Complete 4 connected challenges before the {duration} mission timer expires.</p>
        <p className="briefing-support">Your decisions may change what happens next.</p>
      </section>
      <section className="briefing-objective" aria-labelledby="objective-title">
        <h2 id="objective-title">YOUR MISSION</h2>
        <p className="briefing-objective-main">Complete <strong>4 connected challenges</strong> before the <strong>{duration}</strong> timer expires.</p>
        <p>Investigate carefully. Decisions made in one challenge may affect what happens later.</p>
      </section>
      <section className="briefing-how" aria-labelledby="how-title">
        <h2 id="how-title">HOW TO PLAY</h2>
        <ol className="briefing-steps">{steps.map(([icon, heading, copy], index) => <li key={heading}>
          <span className="briefing-step-number">0{index + 1}</span>
          <div><h3><MissionIcon name={icon} />{heading}</h3><p>{copy}</p></div>
        </li>)}</ol>
      </section>
      <section className="briefing-route" aria-label="4 connected challenges">
        <h2>4 CONNECTED CHALLENGES</h2>
        <ol>{[1, 2, 3, 4].map(number => <li key={number}><span>0{number}</span></li>)}</ol>
      </section>
      <section className="briefing-rules" aria-labelledby="rules-title">
        <h2 id="rules-title">BEFORE YOU BEGIN</h2>
        <div className="briefing-rule-list">
          <div><h3>{duration} TOTAL TIME</h3><p>One timer covers the entire mission.</p></div>
          <div><h3>4 CONNECTED CHALLENGES</h3><p>Complete all four before time expires.</p></div>
          <div><h3>DECISIONS ARE FINAL</h3><p>Once confirmed, a decision cannot be changed.</p></div>
        </div>
      </section>
      <footer className="briefing-footer">
        <button className="briefing-back" type="button" onClick={onBack}><span aria-hidden="true">&larr;</span> BACK TO HOME</button>
        <div className="briefing-start"><button className="briefing-begin" type="button" onClick={onBegin}>BEGIN MISSION <span aria-hidden="true">&rarr;</span></button><p>The {duration} mission timer starts when you press BEGIN MISSION.</p></div>
      </footer>
    </div>
  </main>;
}
