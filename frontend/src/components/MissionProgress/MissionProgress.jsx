import { useTranslation } from "../../locales/LanguageProvider.jsx";

export default function MissionProgress({ currentStation = 1, completedStations = [] }) {
  const { language } = useTranslation();
  return <ol className="gameplay-steps" aria-label={language === "ar" ? "تقدم المهمة" : "Mission progress"}>
    {[1,2,3,4].map(number => {
      const complete = completedStations.includes(number);
      const state = complete ? "complete" : number === currentStation ? "active" : "pending";
      return <li key={number} className={state} aria-current={state === "active" ? "step" : undefined}
        aria-label={String(number).padStart(2,"0") + (complete ? (language === "ar" ? "، مكتملة" : ", completed") : "")}>
        <span>{complete ? "✓" : String(number).padStart(2,"0")}</span>
      </li>;
    })}
  </ol>;
}
