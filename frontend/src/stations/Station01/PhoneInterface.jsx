import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
export default function PhoneInterface({ scenario, onInspectLink, disabled }) {
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
            <div className="phone-sender">
              <span className="sender-avatar">{scenario.sender.name.slice(0, 2).toUpperCase()}</span>
              <strong>{scenario.sender.name}</strong><small>{scenario.sender.displayNumber}</small>
            </div>
          </div>
          <div className="message-thread">
            <p className="thread-date">Today {scenario.timestamp}</p>
            <article className="message-bubble">
              <p>{scenario.message}{scenario.link.exists && <>{" "}<button type="button" className="sms-link" onClick={onInspectLink} disabled={disabled} aria-label={`Inspect link: ${scenario.link.destination}`}>{scenario.link.destination}</button></>}</p>
            </article>
          </div>
          <div className="sms-composer" role="group" aria-label="Message composer unavailable in this simulation">
            <span className="composer-add" aria-hidden="true"><MissionIcon name="plus" /></span>
            <div className="composer-field" aria-disabled="true"><span>Text Message &bull; SMS</span><MissionIcon name="microphone" /></div>
          </div>
          <div className="phone-home-area" aria-hidden="true"><span /></div>
        </div>
      </div>
    </section>
  );
}
