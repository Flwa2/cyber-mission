import { useTranslation } from "../../locales/LanguageProvider.jsx";
import InspectorPanel from "./InspectorPanel.jsx";

export default function LinkInspector({ scenario, onClose, onOpenLink }) {
  const { t } = useTranslation();
  const url = /^https:\/\//.test(scenario.link.displayText || "") ? scenario.link.displayText : scenario.link.destination;
  return (
    <InspectorPanel title={t("Link Details")} onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>{t("Link in message")}</span>
          <strong className="inspected-url" dir="ltr">{url}</strong>
        </div>
      </div>
      <button type="button" className="primary-button panel-action" onClick={onOpenLink}>{t("Open Link")} </button>
    </InspectorPanel>
  );
}
