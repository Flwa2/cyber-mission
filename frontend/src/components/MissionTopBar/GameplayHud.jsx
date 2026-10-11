import FullscreenButton from "../FullscreenButton/FullscreenButton.jsx";
﻿import { useTranslation } from "../../locales/LanguageProvider.jsx";
import PlayerAvatar from "../PlayerAvatar/PlayerAvatar.jsx";
import MissionTimer from "../MissionTimer/MissionTimer.jsx";
import MissionProgress from "../MissionProgress/MissionProgress.jsx";
import "./GameplayHud.css";

export default function GameplayHud({ mission, currentStation, children }) {
  const { language } = useTranslation();
  return <div className="gameplay-hud" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="gameplay-player"><PlayerAvatar avatarId={mission.avatarId}/><bdi>{mission.playerName}</bdi></div>
    <MissionProgress currentStation={currentStation} completedStations={mission.completedStations}/>
    <div className="gameplay-hud-controls"><MissionTimer startedAt={mission.startedAt} timer={mission.timer}/><FullscreenButton/>{children}</div>
  </div>;
}
