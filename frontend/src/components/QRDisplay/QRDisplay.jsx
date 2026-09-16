export default function QRDisplay({ missionId }) {
  return (
    <div className="qr-placeholder" aria-label={`QR handoff placeholder for mission ${missionId}`}>
      <span>QR</span>
      <p>{missionId}</p>
    </div>
  );
}
