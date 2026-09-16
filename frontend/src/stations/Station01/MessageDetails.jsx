import InspectorPanel from "./InspectorPanel.jsx";

export default function MessageDetails({ scenario, onClose }) {
  return (
    <InspectorPanel title="Message Details" onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>Received</span>
          <strong>{scenario.timestamp}</strong>
        </div>
        <div>
          <span>Sender</span>
          <strong>{scenario.sender.name}</strong>
        </div>
        <div>
          <span>Channel</span>
          <strong>SMS</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{scenario.sender.sourceType === "internal" ? "Internal messaging service" : "External number"}</strong>
        </div>
      </div>
    </InspectorPanel>
  );
}

