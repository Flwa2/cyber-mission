export default function SimulatedBrowser({ scenario, onContinue }) {
  return (
    <div className="station01-panel-backdrop" role="dialog" aria-modal="true" aria-labelledby="browser-title">
      <section className="sim-browser">
        <div className="browser-topbar">
          <span />
          <p>{scenario.link.destination}</p>
        </div>
        <div className="browser-page">
          <p className="eyebrow">Secured Booth Browser</p>
          <h2 id="browser-title">Account Review Portal</h2>
          <p>
            This is a fictional in-app page for the awareness simulation. No credentials are collected or transmitted.
          </p>
          <div className="disabled-form" aria-label="Disabled demonstration form">
            <label>
              Corporate ID
              <input value="demo-user" disabled readOnly />
            </label>
            <label>
              Password
              <input value="disabled" disabled readOnly type="password" />
            </label>
          </div>
          <button type="button" className="primary-button" onClick={onContinue}>
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}

