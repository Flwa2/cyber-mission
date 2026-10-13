import { useTranslation } from "../../locales/LanguageProvider.jsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ExitMissionDialog({ onCancel, onExit }) {
  const { t, language } = useTranslation();
  const dialogRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function confirm() {
    if (busy) return;
    setBusy(true); setFailed(false);
    try { await onExit(); } catch { setFailed(true); } finally { setBusy(false); }
  }
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
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
      <div className="exit-marker" aria-hidden="true">!</div>
      <h2 id="exit-title">{t("End participation?")}</h2>
      <p id="exit-description">{t("If you end your participation now, your result will not be counted among participants and will not appear on the leaderboard. Do you want to continue?")}</p>
      {failed && <p className="exit-error" role="alert">{t("Could not end participation. Check the connection and try again.")}</p>}
      <div className="exit-dialog-actions">
        <button type="button" className="exit-cancel" autoFocus disabled={busy} onClick={onCancel}>{t("Return to game")}</button>
        <button type="button" className="exit-confirm" disabled={busy} onClick={confirm}>{t("End participation")}</button>
      </div>
    </dialog>, document.body
  );
}
