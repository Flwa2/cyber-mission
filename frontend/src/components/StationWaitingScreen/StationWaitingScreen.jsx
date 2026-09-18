import { STATION_STATUS, STATIONS } from "../../utils/stationStatus.js";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";

const statusCopy = {
  [STATION_STATUS.WAITING]: "Awaiting previous station",
  [STATION_STATUS.LOCKED]: "Station locked",
  [STATION_STATUS.READY]: "Station ready",
  [STATION_STATUS.ACTIVE]: "Station active",
  [STATION_STATUS.COMPLETED]: "Station completed"
};

export default function StationWaitingScreen({ mission, stationNumber = 2, status = STATION_STATUS.WAITING }) {
  const station = STATIONS.find((item) => item.number === stationNumber) || STATIONS[1];
  const previousStation = Math.max(1, station.number - 1);
  const isReady = status === STATION_STATUS.READY || status === STATION_STATUS.ACTIVE;
  const isCompleted = status === STATION_STATUS.COMPLETED;

  return (
    <main className="screen center-screen station-waiting-screen">
      <section className={`station-waiting-card status-${status.toLowerCase()}`} aria-live="polite">
        <div className="incident-identity large">
          <span className="incident-flag" aria-hidden="true" />
          <div>
            <strong>Cyber Breach</strong>
            <small>Active Incident</small>
          </div>
        </div>

        <div className="waiting-orb" aria-hidden="true">
          <span />
          <span />
        </div>

        <div className="waiting-copy">
          <p className="eyebrow">Station {String(station.number).padStart(2, "0")}</p>
          <h1>{station.name}</h1>
          <p>
            {isCompleted
              ? "Station state recorded."
              : isReady
                ? "This screen is ready for the next participant action."
                : `Awaiting Station ${String(previousStation).padStart(2, "0")}.`}
          </p>
        </div>

        <div className="waiting-meta">
          <div>
            <span>Mission</span>
            <strong>{mission?.missionId || "CM-PREVIEW"}</strong>
          </div>
          {mission?.startedAt && <MissionTimer startedAt={mission.startedAt} />}
          <div>
            <span>Status</span>
            <strong>{statusCopy[status]}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
