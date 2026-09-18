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
      <div className="incident-identity">
        <span className="incident-flag" aria-hidden="true" />
        <div>
          <strong>Cyber Breach</strong>
          <small>Active Incident</small>
        </div>
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
        <div className="exit-confirm-backdrop" role="presentation">
          <section className="exit-confirm-card" role="dialog" aria-modal="true" aria-labelledby="exit-title">
            <p className="eyebrow">Exit Mission</p>
            <h2 id="exit-title">Exit current mission?</h2>
            <p>Your current mission progress will end.</p>
            <div className="confirm-actions">
              <button type="button" className="secondary-button" onClick={() => setExitConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button danger-action" onClick={resetMission}>
                Exit Mission
              </button>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
