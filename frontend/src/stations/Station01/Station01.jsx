import { useEffect, useMemo, useState } from "react";
import MissionProgress from "../../components/MissionProgress/MissionProgress.jsx";
import MissionTopBar from "../../components/MissionTopBar/MissionTopBar.jsx";
import { useMission } from "../../context/MissionContext.jsx";
import { useMissionTimer } from "../../hooks/useMissionTimer.js";
import {
  completeStation01,
  ensureStation01State,
  expireStation01,
  getParticipantScenario,
  recordStation01Investigation
} from "../../utils/station01Engine.js";
import ActionMenu from "./ActionMenu.jsx";
import IncomingNotification from "./IncomingNotification.jsx";
import LinkInspector from "./LinkInspector.jsx";
import MessageDetails from "./MessageDetails.jsx";
import PhoneInterface from "./PhoneInterface.jsx";
import ReportConfirm from "./ReportConfirm.jsx";
import SenderInspector from "./SenderInspector.jsx";
import SimulatedBrowser from "./SimulatedBrowser.jsx";
import StationComplete from "./StationComplete.jsx";
import "./Station01.css";

const INTRO_DURATION_MS = 2600;

export default function Station01({ mission }) {
  const { updateMission } = useMission();
  const timer = useMissionTimer(mission.startedAt);
  const [introVisible, setIntroVisible] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(false);

  const station01 = mission.decisions?.station01;
  const scenario = useMemo(() => getParticipantScenario(station01), [station01]);
  const isLocked = Boolean(station01?.completedAt || station01?.timedOut || processing);

  useEffect(() => {
    if (!station01?.scenarioId) {
      updateMission((currentMission) => ensureStation01State(currentMission));
    }
  }, [station01?.scenarioId, updateMission]);

  useEffect(() => {
    if (station01?.completedAt || station01?.timedOut) {
      setIntroVisible(false);
      return undefined;
    }

    const introTimer = window.setTimeout(() => setIntroVisible(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(introTimer);
  }, [station01?.completedAt, station01?.timedOut]);

  useEffect(() => {
    if (timer.isExpired && station01?.scenarioId && !station01.completedAt && !station01.timedOut) {
      updateMission((currentMission) => expireStation01(currentMission));
      setActivePanel(null);
      setProcessing(false);
    }
  }, [station01?.completedAt, station01?.scenarioId, station01?.timedOut, timer.isExpired, updateMission]);

  function recordInvestigation(actionName, nextPanel) {
    updateMission((currentMission) => recordStation01Investigation(currentMission, actionName));
    setActivePanel(nextPanel);
  }

  function commitFinalAction(finalAction) {
    setActivePanel(null);

    if (finalAction === "openLink") {
      setBrowserVisible(true);
      updateMission((currentMission) => completeStation01(currentMission, finalAction));
      return;
    }

    setProcessing(true);
    updateMission((currentMission) => completeStation01(currentMission, finalAction));

    window.setTimeout(() => {
      setProcessing(false);
    }, 1100);
  }

  if (!scenario || !station01?.scenarioId) {
    return (
      <main className="screen center-screen">
        <section className="status-panel">
          <p className="eyebrow">Station 01 / 04</p>
          <h1>Preparing Message</h1>
          <p>Loading the station scenario.</p>
        </section>
      </main>
    );
  }

  if (introVisible) {
    return <IncomingNotification onSkip={() => setIntroVisible(false)} />;
  }

  if (station01?.timedOut || mission.status === "timed-out") {
    return (
      <main className="screen station-screen">
        <MissionTopBar mission={mission} stationLabel="Station 01 / 04" />
        <section className="station-timeout-card">
          <p className="eyebrow">Mission Time Expired</p>
          <h1>Your current mission session has ended.</h1>
          <p>The final incident assessment will be available in a later phase.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="screen station-screen station01-screen">
      <MissionTopBar mission={mission} stationLabel="Station 01 / 04" />

      {processing && (
        <div className="decision-processing" role="status" aria-live="polite">
          <span />
          <p>Decision Recorded</p>
          <small>Updating mission state...</small>
        </div>
      )}

      {!processing && station01.completedAt && !browserVisible ? (
        <StationComplete mission={mission} />
      ) : (
        <section className="station01-layout" aria-label="Station 01 suspicious message investigation">
          <aside className="station-brief-panel">
            <p className="eyebrow">Station 01 / 04</p>
            <h1>
              Suspicious
              <span>Message</span>
            </h1>
            <p>You've received a message. Take a closer look before you act.</p>
            <div className="station01-progress">
              <MissionProgress currentStation={1} />
            </div>
          </aside>

          <div className="phone-stage">
            <PhoneInterface
              scenario={scenario}
              disabled={isLocked}
              onInspectSender={() => recordInvestigation("inspectSender", "sender")}
              onInspectLink={() => recordInvestigation("inspectLink", "link")}
              onViewDetails={() => recordInvestigation("viewDetails", "details")}
              onOpenActions={() => setActivePanel("actions")}
            />
          </div>

          <aside className="investigation-panel">
            <p className="eyebrow">Investigation Panel</p>
            <h2>Take a closer look</h2>
            <p>Inspect the message before deciding what to do.</p>

            <div className="investigation-status-list">
              <div className={station01.senderInspected ? "done" : ""}>
                <span>Sender</span>
                <strong>{station01.senderInspected ? "Reviewed" : "Available"}</strong>
              </div>
              <div className={station01.linkInspected ? "done" : ""}>
                <span>Link</span>
                <strong>{scenario.link.exists ? (station01.linkInspected ? "Reviewed" : "Available") : "No Link"}</strong>
              </div>
              <div className={station01.messageDetailsViewed ? "done" : ""}>
                <span>Message Details</span>
                <strong>{station01.messageDetailsViewed ? "Reviewed" : "Available"}</strong>
              </div>
            </div>

            <div className="investigation-card-grid">
              <button type="button" onClick={() => recordInvestigation("inspectSender", "sender")} disabled={isLocked}>
                <span>Inspect Sender</span>
                <small>Check the sender's information</small>
              </button>
              {scenario.link.exists && (
                <button type="button" onClick={() => recordInvestigation("inspectLink", "link")} disabled={isLocked}>
                  <span>Inspect Link</span>
                  <small>Preview the link destination</small>
                </button>
              )}
              <button type="button" onClick={() => recordInvestigation("viewDetails", "details")} disabled={isLocked}>
                <span>View Message Details</span>
                <small>Review message metadata</small>
              </button>
              <button type="button" className="decision-card" onClick={() => setActivePanel("actions")} disabled={isLocked}>
                <span>Message Actions</span>
                <small>Decide how to handle it</small>
              </button>
            </div>
          </aside>
        </section>
      )}

      {activePanel === "sender" && <SenderInspector scenario={scenario} onClose={() => setActivePanel(null)} />}
      {activePanel === "link" && (
        <LinkInspector scenario={scenario} onClose={() => setActivePanel(null)} onOpenLink={() => commitFinalAction("openLink")} />
      )}
      {activePanel === "details" && <MessageDetails scenario={scenario} onClose={() => setActivePanel(null)} />}
      {activePanel === "actions" && (
        <ActionMenu
          scenario={scenario}
          onClose={() => setActivePanel(null)}
          onAction={(action) => {
            if (action === "report") {
              setActivePanel("report");
              return;
            }

            commitFinalAction(action);
          }}
        />
      )}
      {activePanel === "report" && <ReportConfirm onCancel={() => setActivePanel("actions")} onConfirm={() => commitFinalAction("report")} />}
      {browserVisible && <SimulatedBrowser scenario={scenario} onContinue={() => setBrowserVisible(false)} />}
    </main>
  );
}
