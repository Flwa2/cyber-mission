import { useTranslation } from "../../locales/LanguageProvider.jsx";
import InspectorPanel from "./InspectorPanel.jsx";

export default function ReportConfirm({ onCancel, onConfirm }) {
  const { t, language } = useTranslation();
  return (
    <InspectorPanel title={t("Report This Message?")} onClose={onCancel}>
      <p className="panel-copy">{t("This will submit the message to the security team for review and close Station 01.")} </p>
      <div className="confirm-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>{t("Cancel")} </button>
        <button type="button" className="primary-button" onClick={onConfirm}>{t("Report")} </button>
      </div>
    </InspectorPanel>
  );
}

