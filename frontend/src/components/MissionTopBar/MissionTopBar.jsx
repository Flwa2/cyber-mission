import CyberMissionBrand from "../CyberMissionBrand/CyberMissionBrand.jsx";
import ExitMissionDialog from "../ExitMissionDialog/ExitMissionDialog.jsx";
import { useState } from "react";
import { useMission } from "../../context/MissionContext.jsx";
import FullscreenButton from "../FullscreenButton/FullscreenButton.jsx";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function MissionTopBar({ mission }) {
  const { resetMission } = useMission();
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  return (
    <header className="mission-topbar">
      <div className="mission-brand-group">
        <CyberMissionBrand variant="compact" />
        <span className="mission-incident-status"><i aria-hidden="true" />ACTIVE INCIDENT <span aria-hidden="true">&bull;</span> CYBER BREACH</span>
      </div>

      <div className="mission-topbar-meta">
        {mission && (
          <>
            <div className="topbar-data">
              <span>Mission ID</span>
              <strong>{mission.missionId}</strong>
            </div>
            <MissionTimer startedAt={mission.startedAt} />
          </>
        )}
        <FullscreenButton />
        {mission && (
          <button
            type="button"
            className="topbar-window-button exit"
            onClick={() => setExitConfirmOpen(true)}
            aria-label="Exit current mission"
            title="Exit current mission"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {exitConfirmOpen && (
        <ExitMissionDialog onCancel={() => setExitConfirmOpen(false)} onExit={resetMission} />
      )}
    </header>
  );
}
