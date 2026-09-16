import InspectorPanel from "./InspectorPanel.jsx";

export default function LinkInspector({ scenario, onClose, onOpenLink }) {
  return (
    <InspectorPanel title="Link Details" onClose={onClose}>
      <div className="evidence-list">
        <div>
          <span>Displayed</span>
          <strong>{scenario.link.displayText}</strong>
        </div>
        <div>
          <span>Destination</span>
          <strong>{scenario.link.destination}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{scenario.link.sourceLabel}</strong>
        </div>
      </div>
      <button type="button" className="primary-button panel-action" onClick={onOpenLink}>
        Open Link
      </button>
    </InspectorPanel>
  );
}

