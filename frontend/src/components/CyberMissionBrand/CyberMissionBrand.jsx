import "./CyberMissionBrand.css";

export default function CyberMissionBrand({ variant = "full" }) {
  return (
    <div className={`cyber-brand cyber-brand--${variant}`} aria-label="Cyber Mission">
      <svg className="cyber-brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
        <path d="M37 10 24 3 7 13v22l17 10 13-7" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 32V17l8 7 8-7v15" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M40 20v9" stroke="currentColor" strokeWidth="3" />
        <circle cx="40" cy="14" r="2" fill="currentColor" />
      </svg>
      {variant !== "icon-only" && <div className="cyber-brand-copy">
        <span className="cyber-brand-name">CYBER <span>MISSION</span></span>
        {variant === "full" && <span className="cyber-brand-tagline">THINK | INVESTIGATE | STAY SECURE</span>}
      </div>}
    </div>
  );
}
