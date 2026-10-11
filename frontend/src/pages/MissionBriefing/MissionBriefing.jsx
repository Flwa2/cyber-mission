import { useTranslation } from "../../locales/LanguageProvider.jsx";
import { useEffect, useRef } from "react";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { SHOW_MISSION_ID } from "../../config/presentationConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./MissionBriefing.css";

const steps = [
  ["details", "INVESTIGATE", "Check what you see."],
  ["actions", "DECIDE", "Choose your response."],
  ["continue", "MOVE FORWARD", "Continue to the next challenge."]
];
export default function MissionBriefing({ mission, onBegin, onBack }) {
  const { t, language } = useTranslation();
  const title = useRef(null);
  const duration = formatTimer(GAME_CONFIG.missionDurationSeconds);
  useEffect(() => { title.current?.focus(); }, []);
  return <main className="mission-briefing" aria-labelledby="briefing-title">
    <header className="briefing-chrome">
      <CyberMissionBrand variant="compact" />
      <div className="briefing-chrome-right">
        {SHOW_MISSION_ID && <div className="briefing-mission-id"><span>{t("MISSION ID")}</span><strong>{mission.missionId}</strong></div>}
        <FullscreenButton />
      </div>
    </header>
    <div className="briefing-content">
      <section className="briefing-intro">
        <p className="briefing-eyebrow">{t("BEFORE YOU BEGIN")}</p>
        <h1 id="briefing-title" tabIndex={-1} ref={title}>{t("briefing.titleLead")} <span>{t("briefing.titleAccent")}</span></h1>
        <p className="briefing-summary">{t("4 challenges. 8 minutes. One connected incident.")}</p>
      </section>
      <ol className="briefing-steps" aria-label={t("How to play")}>{steps.map(([icon, heading, copy]) => <li key={t(heading)}>
        <div className="briefing-step-symbol"><div className="briefing-icon-ring"><MissionIcon name={language === "ar" && icon === "actions" ? "choice" : icon} className={icon === "continue" ? "briefing-forward-icon" : undefined} /></div></div>
        <h2>{t(heading)}</h2><p>{t(copy)}</p>
      </li>)}</ol>
      <section className="briefing-route" aria-label={t("4 connected challenges")}>
        <h2>{t("MISSION PROGRESS")}</h2>
        <ol>{[1, 2, 3, 4].map(number => <li key={number}><span>0{number}</span></li>)}</ol>
      </section>
      <div className="briefing-start">
        <div className="briefing-timer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="14" r="8" /><path d="M12 6V2M9 2h6M18 7l2-2M12 10v5l3 2" /></svg>
          <div className="briefing-duration"><strong>{duration}</strong><span>{t("TOTAL TIME")}</span></div>
          <p>{t("The timer starts when you begin.")}</p>
        </div>
        <button className="briefing-begin" type="button" onClick={onBegin}>{t("BEGIN MISSION")} <span aria-hidden="true">{t("→")}</span></button>
      </div>
      <button className="briefing-back" type="button" onClick={onBack}><span aria-hidden="true">{t("←")}</span> {t("BACK TO HOME")}</button>
    </div>
  </main>;
}
