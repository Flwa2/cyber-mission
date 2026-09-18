import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ExitMissionDialog({ onCancel, onExit }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // showModal uses the browser top layer and makes the rest of the document inert.
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  function containKeyboardFocus(event) {
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialogRef.current.querySelectorAll("button:not(:disabled)"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return createPortal(
    <dialog ref={dialogRef} className="exit-mission-dialog" aria-labelledby="exit-title" aria-describedby="exit-description"
      onKeyDown={containKeyboardFocus}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}>
      <div className="exit-marker" aria-hidden="true">!</div>
      <p className="eyebrow">Exit Mission</p>
      <h2 id="exit-title">End current mission?</h2>
      <p id="exit-description">Your current mission progress will be lost.</p>
      <div className="exit-dialog-actions">
        <button type="button" className="exit-cancel" autoFocus onClick={onCancel}>Cancel</button>
        <button type="button" className="exit-confirm" onClick={onExit}>Exit Mission</button>
      </div>
    </dialog>, document.body
  );
}
