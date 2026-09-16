export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <h2 id="modal-title">{title}</h2>
        <div>{children}</div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
