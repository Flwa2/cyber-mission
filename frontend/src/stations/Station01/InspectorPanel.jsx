export default function InspectorPanel({ title, children, onClose }) {
  return (
    <div className="station01-panel-backdrop" role="dialog" aria-modal="true" aria-labelledby="station01-panel-title">
      <section className="station01-panel">
        <div className="panel-header">
          <p className="eyebrow" id="station01-panel-title">
            {title}
          </p>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close panel">
            Close
          </button>
        </div>
        <div className="panel-content">{children}</div>
      </section>
    </div>
  );
}

