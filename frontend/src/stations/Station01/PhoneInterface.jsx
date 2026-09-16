export default function PhoneInterface({
  scenario,
  onInspectSender,
  onInspectLink,
  onViewDetails,
  onOpenActions,
  disabled
}) {
  return (
    <section className="phone-shell" aria-label="Simulated corporate mobile phone">
      <div className="phone-hardware">
        <div className="phone-speaker" />
        <div className="phone-screen">
          <div className="phone-status">
            <span>{scenario.timestamp}</span>
            <span>CM Secure</span>
          </div>

          <div className="phone-app-bar">
            <button type="button" aria-label="Inspect sender details" onClick={onInspectSender} disabled={disabled}>
              <span className="sender-avatar">{scenario.sender.name.slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{scenario.sender.name}</strong>
                <small>{scenario.sender.displayNumber}</small>
              </span>
            </button>
            <button type="button" className="phone-icon-button" onClick={onViewDetails} disabled={disabled}>
              Details
            </button>
          </div>

          <div className="message-thread">
            <p className="thread-date">{scenario.timestamp}</p>
            <article className="message-bubble">
              <p>{scenario.message}</p>
              {scenario.link.exists && (
                <button type="button" className="message-link" onClick={onInspectLink} disabled={disabled}>
                  {scenario.link.displayText}
                </button>
              )}
            </article>
          </div>

          <div className="phone-action-bar">
            {scenario.link.exists && (
              <button type="button" onClick={onInspectLink} disabled={disabled}>
                Inspect Link
              </button>
            )}
            <button type="button" onClick={onOpenActions} disabled={disabled}>
              Actions
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

