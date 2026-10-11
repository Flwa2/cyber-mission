import { useTranslation } from "../../locales/LanguageProvider.jsx";
import CyberMissionBrand from "../CyberMissionBrand/CyberMissionBrand.jsx";
import ExitMissionDialog from "../ExitMissionDialog/ExitMissionDialog.jsx";
import { useState } from "react";
import { useMission } from "../../context/MissionContext.jsx";
import FullscreenButton from "../FullscreenButton/FullscreenButton.jsx";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";

import GameplayHud from "./GameplayHud.jsx";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function MissionTopBar(props) {
  return props.onExit ? <MissionTopBarView {...props} /> : <ContextMissionTopBar {...props} />;
}

function ContextMissionTopBar(props) {
  const { resetMission } = useMission();
  return <MissionTopBarView {...props} onExit={resetMission} />;
}

function MissionTopBarView({ mission, hideIncident = false, onExit, currentStation }) {
  const { t, language } = useTranslation();
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  return (
    <header className="mission-topbar">
      {currentStation && mission ? <GameplayHud mission={mission} currentStation={currentStation} /> : <>
      <div className="mission-brand-group">
        <CyberMissionBrand variant="compact" />
        {!hideIncident && <span className="mission-incident-status"><i aria-hidden="true" />{t("ACTIVE INCIDENT")} <span aria-hidden="true">{t("•")}</span> {t("CYBER BREACH")}</span>}
      </div>

      <div className="mission-topbar-meta">
        {mission && (
          <>
            <div className="topbar-data">
              <span>{t("Mission ID")}</span>
              <strong>{mission.missionId}</strong>
            </div>
            <MissionTimer startedAt={mission.startedAt} timer={mission.timer} />
          </>
        )}
        <FullscreenButton />
        {mission && (
          <button
            type="button"
            className="topbar-window-button exit"
            onClick={() => setExitConfirmOpen(true)}
            aria-label={t("Exit current mission")}
            title={t("Exit current mission")}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      </>}
      {exitConfirmOpen && (
        <ExitMissionDialog onCancel={() => setExitConfirmOpen(false)} onExit={onExit} />
      )}
    </header>
  );
}
