import { useTranslation } from "../../locales/LanguageProvider.jsx";
export default function LoadingScreen() {
  const { t, language } = useTranslation();
  return (
    <main className="screen center-screen">
      <div className="status-panel">
        <p className="eyebrow">{t("Cyber Mission")}</p>
        <h1>{t("Loading Mission Console")}</h1>
      </div>
    </main>
  );
}
