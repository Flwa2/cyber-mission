import InspectorPanel from "./InspectorPanel.jsx";

export default function ReportConfirm({ onCancel, onConfirm }) {
  return (
    <InspectorPanel title="Report This Message?" onClose={onCancel}>
      <p className="panel-copy">
        This will submit the message to the security team for review and close Station 01.
      </p>
      <div className="confirm-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          Report
        </button>
      </div>
    </InspectorPanel>
  );
}

