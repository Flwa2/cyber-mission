import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import MissionIcon from "../MissionIcon/MissionIcon.jsx";

export default function MissionDialog({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const targets = [...ref.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]')];
    const first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return createPortal(<dialog ref={ref} className={`mission-dialog ${className}`} aria-labelledby={titleId}
    onKeyDown={trapFocus} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="panel-header">
      <div><span className="dialog-kicker">CYBER MISSION / INVESTIGATION</span><h2 id={titleId}>{title}</h2></div>
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close panel"><MissionIcon name="close" /></button>
    </header>
    <div className="panel-content">{children}</div>
  </dialog>, document.body);
}
