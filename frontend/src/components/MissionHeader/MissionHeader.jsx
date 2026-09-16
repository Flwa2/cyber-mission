import { GAME_CONFIG } from "../../config/gameConfig.js";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";

export default function MissionHeader({ mission }) {
  return (
    <header className="mission-header">
      <div>
        <p className="eyebrow">Cyber Mission</p>
        <h1>{GAME_CONFIG.missionName}</h1>
      </div>
      {mission && (
        <div className="header-meta">
          <div>
            <span>Mission ID</span>
            <strong>{mission.missionId}</strong>
          </div>
          <MissionTimer startedAt={mission.startedAt} />
        </div>
      )}
    </header>
  );
}
