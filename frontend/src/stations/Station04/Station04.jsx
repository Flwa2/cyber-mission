import MissionHeader from "../../components/MissionHeader/MissionHeader.jsx";
import MissionProgress from "../../components/MissionProgress/MissionProgress.jsx";

export default function Station04({ mission }) {
  return (
    <main className="screen station-screen">
      <MissionHeader mission={mission} />
      <MissionProgress currentStation={4} />
      <section className="status-panel">
        <p className="eyebrow">Station 04 / 04</p>
        <h1>Connect the Evidence</h1>
        <p>Development pending.</p>
      </section>
    </main>
  );
}
