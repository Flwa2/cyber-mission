import InspectorPanel from "./InspectorPanel.jsx";

export default function SenderInspector({ scenario, onClose }) {
  return (
    <InspectorPanel title="Sender Details" onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>Sender</span>
          <strong>{scenario.sender.name}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{scenario.sender.sourceType === "internal" ? "Internal messaging service" : "External number"}</strong>
        </div>
        <div>
          <span>Verification</span>
          <strong>{scenario.sender.verificationLabel}</strong>
        </div>
        <div>
          <span>Displayed as</span>
          <strong>{scenario.sender.displayNumber}</strong>
        </div>
      </div>
    </InspectorPanel>
  );
}

