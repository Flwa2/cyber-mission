import { useTranslation } from "../../locales/LanguageProvider.jsx";
export default function IncomingNotification({ onSkip }) {
  const { t, language } = useTranslation();
  return (
    <main className="screen station01-intro-screen">
      <section className="station01-intro-card">
        <p className="eyebrow">{t("Station 01")}</p>
        <h1>{language === "ar" ? "فحص الرسالة" : "Message Inspection"}</h1>
        <div className="incoming-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="incoming-label">{t("Incoming Message")}</p>
        <button type="button" className="secondary-button" onClick={onSkip}>{t("Open Message")} </button>
      </section>
    </main>
  );
}
