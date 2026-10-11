import { useTranslation } from "../../locales/LanguageProvider.jsx";
import MissionDialog from "../../components/MissionDialog/MissionDialog.jsx";
import { getLinkPreview } from "../../data/linkPreviews.js";
import "./SimulatedBrowser.css";

export default function SimulatedBrowser({ scenario, onContinue }) {
  const { t, language } = useTranslation();
  const page = getLinkPreview(scenario.id, language);
  if (!page) return null;
  return <MissionDialog title={t("Destination preview")} onClose={onContinue} className="destination-preview">
    <div className="destination-address">{scenario.link.destination}</div>
    <section className="destination-page">
      <p className="destination-brand">{page.brand}</p>
      <h2>{page.title}</h2>
      <p className="destination-description">{page.description}</p>
      <dl>{page.facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {page.fields && <div className="destination-fields">{page.fields.map(label=><label key={label}>{label}<input disabled readOnly value="" placeholder={t("••••••••")} aria-label={label} /></label>)}</div>}
      <button className="destination-page-action" type="button" disabled>{page.action}</button>
    </section>
    <button className="destination-return" type="button" onClick={onContinue}>{t("BACK TO MESSAGE")}</button>
  </MissionDialog>;
}
