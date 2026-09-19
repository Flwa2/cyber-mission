import MissionDialog from "../../components/MissionDialog/MissionDialog.jsx";
export default function InspectorPanel({ title, children, onClose }) {
  return <MissionDialog title={title} onClose={onClose}>{children}</MissionDialog>;
}
