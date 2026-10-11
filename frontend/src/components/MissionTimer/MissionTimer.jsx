import { useTranslation } from "../../locales/LanguageProvider.jsx";
import { useMissionTimer } from "../../hooks/useMissionTimer.js";

export default function MissionTimer({ startedAt, timer, label = "Mission Time" }) {
  const { t, language } = useTranslation();
  const missionTimer = useMissionTimer(startedAt, timer);

  return (
    <div className="mission-timer" aria-live="polite">
      <span>{t(label)}</span>
      <strong>{missionTimer.displayTime}</strong>
    </div>
  );
}
