import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
export default function PhoneInterface({ scenario, onInspectSender, onInspectLink, onViewDetails, disabled }) {
  return (
    <section className="phone-shell" aria-label="Simulated corporate mobile phone">
      <div className="phone-hardware">
        <span className="phone-side-key volume" aria-hidden="true" /><span className="phone-side-key power" aria-hidden="true" />
        <div className="phone-screen">
          <div className="phone-status">
            <span>{scenario.timestamp.replace(/\s*(AM|PM)$/i, "")}</span>
            <div className="phone-island" aria-hidden="true"><i /></div>
            <span className="phone-indicators" aria-label="Signal, Wi-Fi and battery"><i /><i /><i /><MissionIcon name="wifi" /><b /></span>
          </div>
          <div className="phone-app-bar">
            <button type="button" className="phone-sender" aria-label="Inspect sender details" onClick={onInspectSender} disabled={disabled}>
              <span className="sender-avatar">{scenario.sender.name.slice(0, 2).toUpperCase()}</span>
              <strong>{scenario.sender.name}</strong><small>{scenario.sender.displayNumber}</small>
            </button>
            <button type="button" className="phone-info" onClick={onViewDetails} disabled={disabled} aria-label="View message information"><MissionIcon name="details" /></button>
          </div>
          <div className="message-thread">
            <p className="thread-date">Text Message<span>Today {scenario.timestamp}</span></p>
            <article className="message-bubble">
              <p>{scenario.message}</p>
              {scenario.link.exists && <button type="button" className="message-link-card" onClick={onInspectLink} disabled={disabled}>
                <MissionIcon name="link" /><span><strong>{scenario.link.displayText}</strong><small>{scenario.link.destination}</small></span><MissionIcon name="continue" />
              </button>}
            </article>
          </div>
          <div className="phone-home-area" aria-hidden="true"><span /></div>
        </div>
      </div>
    </section>
  );
}
