import InspectorPanel from "./InspectorPanel.jsx";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
const choices = [
  ["report", "Report Message", "Send to the security mailbox"],
  ["block", "Block Sender", "Prevent additional messages"],
  ["delete", "Delete Message", "Remove from this device"],
  ["continue", "Continue / Dismiss", "No further action on this message"]
];
export default function ActionMenu({ onClose, onAction }) {
  return <InspectorPanel title="Message Actions" onClose={onClose}>
    <div className="action-grid">{choices.map(([action, title, description]) =>
      <button type="button" key={action} onClick={() => onAction(action)}>
        <MissionIcon name={action} /><span>{title}</span><small>{description}</small><MissionIcon name="continue" className="row-arrow" />
      </button>
    )}</div>
  </InspectorPanel>;
}
