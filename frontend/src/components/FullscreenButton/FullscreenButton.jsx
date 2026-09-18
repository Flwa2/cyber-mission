import { useEffect, useState } from "react";

function FullscreenIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {active ? (
        <>
          <path d="M9 3v6H3" />
          <path d="M15 3v6h6" />
          <path d="M9 21v-6H3" />
          <path d="M15 21v-6h6" />
        </>
      ) : (
        <>
          <path d="M8 3H3v5" />
          <path d="M16 3h5v5" />
          <path d="M8 21H3v-5" />
          <path d="M16 21h5v-5" />
        </>
      )}
    </svg>
  );
}

export default function FullscreenButton() {
  const [active, setActive] = useState(Boolean(document.fullscreenElement));
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  async function toggle() {
    try {
      setError("");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen?.();
    } catch {
      setError("Fullscreen unavailable. Use your browser's fullscreen control.");
    }
  }
  return <>
    <button type="button" className="topbar-window-button" onClick={toggle}
      aria-label={active ? "Exit fullscreen" : "Enter fullscreen"}
      title={active ? "Exit fullscreen" : "Enter fullscreen"}>
      <FullscreenIcon active={active} />
    </button>
    {error && <span role="status" className="fullscreen-error">{error}</span>}
  </>;
}
