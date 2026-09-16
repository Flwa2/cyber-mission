import { GAME_CONFIG } from "../../config/gameConfig.js";

export default function MissionProgress({ currentStation = 1 }) {
  return (
    <ol className="mission-progress" aria-label="Mission station progress">
      {Array.from({ length: GAME_CONFIG.stationCount }, (_, index) => {
        const stationNumber = index + 1;
        const state = stationNumber === currentStation ? "active" : stationNumber < currentStation ? "complete" : "pending";

        return (
          <li key={stationNumber} className={state}>
            <span>{String(stationNumber).padStart(2, "0")}</span>
            <p>{GAME_CONFIG.stationNames[stationNumber]}</p>
          </li>
        );
      })}
    </ol>
  );
}
