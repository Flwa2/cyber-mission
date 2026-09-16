import MissionHeader from "../../components/MissionHeader/MissionHeader.jsx";
import MissionProgress from "../../components/MissionProgress/MissionProgress.jsx";

export default function Station02({ mission }) {
  return (
    <main className="screen station-screen">
      <MissionHeader mission={mission} />
      <MissionProgress currentStation={2} />
      <section className="status-panel">
        <p className="eyebrow">Station 02 / 04</p>
        <h1>The Desk</h1>
        <p>Development pending.</p>
      </section>
    </main>
  );
}
