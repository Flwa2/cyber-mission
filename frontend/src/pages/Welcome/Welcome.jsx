import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./Welcome.css";

export default function Welcome({ onStartMission, launching = false }) {
  return (
    <main className={`cinematic-home${launching ? " is-launching" : ""}`} aria-label="Cyber Mission welcome" aria-busy={launching}>
      <div className="home-hud">
        <div className="home-duration" aria-label="Mission duration: eight minutes">
          <span>MISSION TIME</span>
          <strong>{formatTimer(GAME_CONFIG.missionDurationSeconds)}</strong>
        </div>
        <FullscreenButton />
      </div>
      <div className="home-action">
        <button type="button" className="home-start" onClick={onStartMission} disabled={launching}>
          START MISSION <span aria-hidden="true">&rarr;</span>
        </button>
        <p>CAN YOU STOP THE BREACH?</p>
      </div>
    </main>
  );
}
