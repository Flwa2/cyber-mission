import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./Welcome.css";

export default function Welcome({ onStartMission, launching = false }) {
  return (
    <main className={`cinematic-home${launching ? " is-launching" : ""}`} aria-label="Cyber Mission welcome" aria-busy={launching}>
      <div className="home-brand"><CyberMissionBrand /></div>
      <div className="home-hud">
        <div className="home-duration" aria-label="Mission duration: eight minutes">
          <span>MISSION TIME</span>
          <strong>{formatTimer(GAME_CONFIG.missionDurationSeconds)}</strong>
        </div>
        <FullscreenButton />
      </div>
      <div className="home-action">
        <div className="home-incident"><span aria-hidden="true" />ACTIVE INCIDENT</div>
        <button type="button" className="home-start" onClick={onStartMission} disabled={launching}>
          START MISSION <span aria-hidden="true">&rarr;</span>
        </button>
        <p>CAN YOU STOP THE BREACH?</p>
        {launching && <div className="home-launch-message" role="status">INCIDENT RESPONSE INITIATED</div>}
      </div>
    </main>
  );
}
