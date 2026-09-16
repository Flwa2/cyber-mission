export default function StationTransition({ stationNumber, stationName }) {
  return (
    <main className="screen center-screen">
      <section className="status-panel">
        <p className="eyebrow">Station Complete</p>
        <h1>Proceed to Station {String(stationNumber).padStart(2, "0")}</h1>
        <p>{stationName}</p>
      </section>
    </main>
  );
}
