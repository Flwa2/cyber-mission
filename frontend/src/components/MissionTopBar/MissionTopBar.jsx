import { useEffect, useState } from "react";
import { useMission } from "../../context/MissionContext.jsx";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";

export default function MissionTopBar({ mission, stationLabel = "Station 01 / 04" }) {
  const { resetMission } = useMission();
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen?.();
  }

  return (
    <header className="mission-topbar">
      <div className="mission-brand">
        <span className="mission-mark" aria-hidden="true">
          CM
        </span>
        <div>
          <strong>Cyber Mission</strong>
          <small>Think | Investigate | Stay Secure</small>
        </div>
      </div>

      <div className="mission-topbar-center">
        <span>{stationLabel}</span>
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
        <button type="button" className="topbar-icon-button" onClick={() => setIsMuted((value) => !value)}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button type="button" className="topbar-icon-button" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        {mission && (
          <button type="button" className="topbar-icon-button exit" onClick={resetMission}>
            Exit Mission
          </button>
        )}
      </div>
    </header>
  );
}

