import FullscreenButton from "../FullscreenButton/FullscreenButton.jsx";
import { useState } from "react";
import { useTranslation } from "../../locales/LanguageProvider.jsx";
import PlayerAvatar from "../PlayerAvatar/PlayerAvatar.jsx";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";
import MissionProgress from "../MissionProgress/MissionProgress.jsx";
import ExitMissionDialog from "../ExitMissionDialog/ExitMissionDialog.jsx";
import "./GameplayHud.css";

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
}

export default function GameplayHud({ mission, currentStation, onExit, children }) {
  const { language, t } = useTranslation();
  const [exitOpen, setExitOpen] = useState(false);
  return <div className="gameplay-hud" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="gameplay-player"><PlayerAvatar avatarId={mission.avatarId}/><bdi>{mission.playerName}</bdi></div>
    <MissionProgress currentStation={currentStation} completedStations={mission.completedStations}/>
    <div className="gameplay-hud-controls"><MissionTimer startedAt={mission.startedAt} timer={mission.timer}/><FullscreenButton/>{children}
      {onExit && <button type="button" className="topbar-window-button exit gameplay-exit" onClick={() => setExitOpen(true)} aria-label={t("Exit current mission")} title={t("Exit current mission")}><CloseIcon/></button>}
    </div>
    {exitOpen && <ExitMissionDialog onCancel={() => setExitOpen(false)} onExit={onExit}/>}
  </div>;
}