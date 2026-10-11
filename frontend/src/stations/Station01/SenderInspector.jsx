import { useTranslation } from "../../locales/LanguageProvider.jsx";
import InspectorPanel from "./InspectorPanel.jsx";

export default function SenderInspector({ scenario, onClose }) {
  const { t } = useTranslation();
  return (
    <InspectorPanel title={t("Sender Details")} onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>{t("Sender name")}</span>
          <strong>{scenario.sender.name}</strong>
        </div>
      </div>
    </InspectorPanel>
  );
}
