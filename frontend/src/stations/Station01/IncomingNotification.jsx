export default function IncomingNotification({ onSkip }) {
  return (
    <main className="screen station01-intro-screen">
      <section className="station01-intro-card">
        <p className="eyebrow">Station 01 / 04</p>
        <h1>Suspicious Message</h1>
        <div className="incoming-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="incoming-label">Incoming Message</p>
        <button type="button" className="secondary-button" onClick={onSkip}>
          Open Message
        </button>
      </section>
    </main>
  );
}

