import InspectorPanel from "./InspectorPanel.jsx";

export default function ActionMenu({ scenario, onClose, onAction }) {
  return (
    <InspectorPanel title="Message Actions" onClose={onClose}>
      <div className="action-grid">
        {scenario.link.exists && (
          <button type="button" onClick={() => onAction("openLink")}>
            <em aria-hidden="true">↗</em>
            <span>Open Link</span>
            <small>Open in the secured booth browser</small>
          </button>
        )}
        <button type="button" onClick={() => onAction("report")}>
          <em aria-hidden="true">!</em>
          <span>Report Message</span>
          <small>Send to the security mailbox</small>
        </button>
        <button type="button" onClick={() => onAction("block")}>
          <em aria-hidden="true">⊘</em>
          <span>Block Sender</span>
          <small>Prevent additional messages</small>
        </button>
        <button type="button" onClick={() => onAction("delete")}>
          <em aria-hidden="true">×</em>
          <span>Delete Message</span>
          <small>Remove from this device</small>
        </button>
        <button type="button" onClick={() => onAction("continue")}>
          <em aria-hidden="true">→</em>
          <span>Continue / Dismiss</span>
          <small>No further action on this message</small>
        </button>
      </div>
    </InspectorPanel>
  );
}
