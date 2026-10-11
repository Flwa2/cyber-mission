import { useTranslation } from "../../locales/LanguageProvider.jsx";
import InspectorPanel from "./InspectorPanel.jsx";

export default function MessageDetails({ scenario, onClose }) {
  const { t } = useTranslation();
  return (
    <InspectorPanel title={t("Message Details")} onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>{t("Received")}</span>
          <strong>{scenario.timestamp}</strong>
        </div>
        <div>
          <span>{t("Context")}</span>
          <strong>{scenario.messageContext || t(scenario.sender.sourceType === "internal" ? "Internal messaging service" : "External number")}</strong>
        </div>
      </div>
    </InspectorPanel>
  );
}
