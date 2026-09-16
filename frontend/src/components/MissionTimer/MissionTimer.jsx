import { useMissionTimer } from "../../hooks/useMissionTimer.js";

export default function MissionTimer({ startedAt, label = "Mission Time" }) {
  const timer = useMissionTimer(startedAt);

  return (
    <div className="mission-timer" aria-live="polite">
      <span>{label}</span>
      <strong>{timer.displayTime}</strong>
    </div>
  );
}
