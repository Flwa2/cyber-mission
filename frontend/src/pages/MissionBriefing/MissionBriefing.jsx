import { useEffect, useRef } from "react";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./MissionBriefing.css";

const instructions = [
  ["details", "COMPLETE EACH CHALLENGE", "Work through four connected situations."],
  ["actions", "MAKE YOUR DECISION", "Inspect what you see and choose how to respond."],
  ["link", "YOUR CHOICES CARRY FORWARD", "Earlier decisions may change what appears later."]
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
    <section className="briefing-content">
      <div className="briefing-intro">
        <p className="briefing-eyebrow">BEFORE YOU BEGIN</p>
        <h1 id="briefing-title" tabIndex={-1} ref={title}>MISSION <span>BRIEFING</span></h1>
        <p className="briefing-lead">A cyber incident is unfolding.<br />Complete four connected challenges before time runs out.</p>
        <p className="briefing-support">Your decisions may change what happens next.</p>
      </div>
      <section className="briefing-route" aria-labelledby="journey-title">
        <div className="briefing-route-heading"><h2 id="journey-title">4 CONNECTED CHALLENGES</h2><span>ONE INCIDENT</span></div>
        <ol>{["START HERE", "UNLOCKS NEXT", "UNLOCKS NEXT", "FINAL STAGE"].map((label, index) => <li key={index}><span>0{index + 1}</span><small>{label}</small></li>)}</ol>
      </section>
      <div className="briefing-lower">
        <section className="briefing-how" aria-labelledby="how-title">
          <h2 id="how-title">HOW THE MISSION WORKS</h2>
          <div className="briefing-instructions">{instructions.map(([icon, heading, copy]) => <article key={heading}><MissionIcon name={icon} /><div><h3>{heading}</h3><p>{copy}</p></div></article>)}</div>
          <aside className="briefing-note"><MissionIcon name="report" /><div><h3>YOUR DECISIONS MATTER</h3><p>What you do in one challenge may affect what happens later.</p></div></aside>
        </section>
        <section className="briefing-time" aria-label="Mission time and start">
          <div className="briefing-time-heading"><strong>{duration}</strong><span>TOTAL<br />MISSION TIME</span></div>
          <p>The timer starts only when you press <strong>BEGIN MISSION.</strong></p>
          <p>Complete all four challenges before time runs out.</p>
          <div className="briefing-start"><h2>READY TO RESPOND?</h2><button className="briefing-begin" type="button" onClick={onBegin}>BEGIN MISSION <span aria-hidden="true">&rarr;</span></button><small>The {duration} mission timer starts when you begin.</small></div>
        </section>
      </div>
      <button className="briefing-back" type="button" onClick={onBack}><span aria-hidden="true">&larr;</span> BACK TO HOME</button>
    </section>
  </main>;
}
