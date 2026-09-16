import { GAME_CONFIG } from "../../config/gameConfig.js";

export default function Welcome({ onStartMission }) {
  return (
    <main className="screen welcome-screen">
      <section className="welcome-hero">
        <div className="hero-copy">
          <p className="eyebrow">Cyber Mission</p>
          <h1>
            Cyber Breach
            <span>8 Minutes to Contain</span>
          </h1>
          <p className="hero-text">
            A security incident is developing. Your decisions will determine what happens next.
          </p>
          <button type="button" className="primary-button" onClick={onStartMission}>
            Start Mission
          </button>
        </div>

        <div className="mission-card" aria-label="Mission briefing">
          <div>
            <span>Mission</span>
            <strong>{GAME_CONFIG.stationCount} Stations</strong>
          </div>
          <div>
            <span>Time</span>
            <strong>08:00</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Ready</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
