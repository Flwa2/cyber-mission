import { useTranslation } from "../../locales/LanguageProvider.jsx";
import CyberMissionBrand from "../../components/CyberMissionBrand/CyberMissionBrand.jsx";
import FullscreenButton from "../../components/FullscreenButton/FullscreenButton.jsx";
import { GAME_CONFIG } from "../../config/gameConfig.js";
import { formatTimer } from "../../hooks/useMissionTimer.js";
import "./Welcome.css";
import LanguageSelector from '../../locales/LanguageSelector.jsx';

export default function Welcome({ onStartMission, onLanguageChange, launching = false }) {
  const { t, language } = useTranslation();
  return (
    <main className={`cinematic-home${launching ? " is-launching" : ""}`} aria-label={t("Cyber Mission welcome")} aria-busy={launching}>
      {language === "ar" && <div className="home-ar-art-mask" aria-hidden="true"><span /></div>}
      <div className="home-brand"><CyberMissionBrand /></div>
      <div className="home-hud">
        <LanguageSelector onChange={onLanguageChange}/>
        <div className="home-duration" aria-label={t("Mission duration: eight minutes")}>
          <span>{t("MISSION TIME")}</span>
          <strong>{formatTimer(GAME_CONFIG.missionDurationSeconds)}</strong>
        </div>
        <FullscreenButton />
      </div>
      <div className="home-action">
        {language !== "ar" && <div className="home-incident"><span aria-hidden="true" />{t("ACTIVE INCIDENT")}</div>}
        <button type="button" className="home-start" onClick={onStartMission} disabled={launching}>{t("START MISSION")} <span aria-hidden="true">{t("→")}</span>
        </button>
        <p>{t("CAN YOU STOP THE BREACH?")}</p>
        {launching && <div className="home-launch-message" role="status">{t("INCIDENT RESPONSE INITIATED")}</div>}
      </div>
    </main>
  );
}
