import { useTranslation } from "../../locales/LanguageProvider.jsx";
import MissionTimer from "../../components/MissionTimer/MissionTimer.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";

export default function StationCompletion({ mission, stationNumber=1 }) {
  const { t, language } = useTranslation();
  const current=String(stationNumber).padStart(2,"0");
  const next=String(stationNumber+1).padStart(2,"0");
  return (
    <section className="station-complete-card" aria-label={t("Station")+" "+current+" "+t("Complete")}>
      <div className="handoff-scan" aria-hidden="true" />
      <div className="complete-signal" aria-hidden="true"><span /></div>
      <div className="complete-copy">
        <p className="eyebrow">{t("Station")} {current}</p>
        <h2>{t("Complete")}</h2>
        <strong>{t(stationNumber===1 ? (language === "ar" ? "station01.savedDecision" : "Decision Recorded") : "Decisions Recorded")}</strong>
      </div>
      <div className="completion-meta">
        <span>{t(language === "ar" && stationNumber === 1 ? "Mission ID" : "MISSION")} <strong>{mission.missionId}</strong></span>
        <span aria-hidden="true">{t("•")}</span>
        <MissionTimer startedAt={mission.startedAt} timer={mission.timer} label={language === "ar" && stationNumber === 1 ? "Remaining time" : "Time"} />
      </div>
      <div className="handoff-panel">
        <span className="handoff-label">{t("Next Station")}</span>
        <div className="handoff-destination"><span>{next}</span><strong>{t(GAME_CONFIG.stationNames[stationNumber + 1])}</strong></div>
        {mission.independent ? <p className="handoff-instruction">{language==='ar'?'جارٍ فتح المحطة التالية…':'Opening the next station…'}</p> : language === "ar" ? <p className="handoff-instruction">{t(`Continue at station ${next}.`)}</p> : <>
        <p className="handoff-instruction">{t("Proceed to Station")} {next} <span aria-hidden="true">{t("→")}</span></p>
        <p>{t("Preparing station for the next participant...")}</p>
        </>}
      </div>
    </section>
  );
}
