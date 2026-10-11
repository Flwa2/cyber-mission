import { useTranslation } from "../../locales/LanguageProvider.jsx";
import { localizeDisplay } from "../../locales/translate.js";
import MissionIcon from "../../components/MissionIcon/MissionIcon.jsx";
import { useEffect, useMemo, useState } from "react";
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

const INTRO_DURATION_MS = 600;

export default function Station01({ mission }) {
  const { t, language } = useTranslation();
  const { updateMission } = useMission();
  const timer = useMissionTimer(mission.startedAt, mission.timer);
  const [introVisible, setIntroVisible] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [browserVisible, setBrowserVisible] = useState(false);

  const station01 = mission.decisions?.station01;
  const scenario = useMemo(() => localizeDisplay(getParticipantScenario(station01, language), language), [station01, language]);
  const isLocked = Boolean(station01?.completedAt || station01?.timedOut);

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
    }
  }, [station01?.completedAt, station01?.scenarioId, station01?.timedOut, timer.isExpired, updateMission]);

  function recordInvestigation(actionName, nextPanel) {
    updateMission((currentMission) => recordStation01Investigation(currentMission, actionName));
    setActivePanel(nextPanel);
  }

  function commitFinalAction(finalAction) {
    setActivePanel(null);

    updateMission((currentMission) => completeStation01(currentMission, finalAction));
  }

  if (!scenario || !station01?.scenarioId) {
    return (
      <main className="screen center-screen">
        <section className="status-panel">
          <p className="eyebrow">{t("Station 01")}</p>
          <h1>{t("Preparing Message")}</h1>
          <p>{t("Loading the station scenario.")}</p>
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
        <MissionTopBar currentStation={1} mission={mission} hideIncident={language === "ar"} />
        <section className="station-timeout-card">
          <p className="eyebrow">{t("Mission Time Expired")}</p>
          <h1>{t("Your current mission session has ended.")}</h1>
          <p>{t("The final incident assessment will be available in a later phase.")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="screen station-screen station01-screen">
      <div className="incident-room" aria-hidden="true"><div className="room-monitor" /><div className="room-beacon" /><div className="room-glass" /><div className="room-desk" /></div>
      <MissionTopBar currentStation={1} mission={mission} hideIncident={language === "ar"} />

      {station01.completedAt && !browserVisible ? (
        <StationComplete mission={mission} />
      ) : (
        <section className="station01-layout" aria-label={t("Station 01 suspicious message investigation")}>
          <aside className="station-brief-panel" aria-label={t("Current station")}>
            <p className="eyebrow">{t("Station 01")}</p>
            <h1>{language === "ar" ? "فحص" : "Message"} <span>{language === "ar" ? "الرسالة" : "Inspection"}</span>
            </h1>
            <p>{t("Investigate the message before you act.")}</p>
          </aside>

          <div className="phone-stage">
            <PhoneInterface
              scenario={scenario}
              disabled={isLocked}
              onInspectLink={() => recordInvestigation("inspectLink", "link")}
            />
          </div>

          <aside className="investigation-panel">
            {language === "ar" ? <>
              <h2>{t("station01.workspaceTitle")}</h2>
              <p className="workspace-instruction">{t("station01.workspaceInstruction")}</p>
            </> : <>
              <p className="eyebrow">{t("Investigation Workspace")}</p>
              <h2>{t("Investigate")}</h2>
            </>}

            <div className="investigation-card-grid">
              <button type="button" onClick={() => recordInvestigation("inspectSender", "sender")} disabled={isLocked}>
                <MissionIcon name="sender" />
                <span>{t("Inspect Sender")}</span>
                <small>{t("Sender information")}</small>
              </button>
              {scenario.link.exists && (
                <button type="button" onClick={() => recordInvestigation("inspectLink", "link")} disabled={isLocked}>
                  <MissionIcon name="link" />
                  <span>{t("Inspect Link")}</span>
                  <small>{t("Destination preview")}</small>
                </button>
              )}
              <button type="button" onClick={() => recordInvestigation("viewDetails", "details")} disabled={isLocked}>
                <MissionIcon name="details" />
                <span>{t("View Message Details")}</span>
                <small>{t("Message metadata")}</small>
              </button>
              <button type="button" className="decision-card" onClick={() => setActivePanel("actions")} disabled={isLocked}>
                <MissionIcon name={language === "ar" ? "choice" : "actions"} />
                <span>{t("Take Action")}</span>
                {language !== "ar" && <small>{t("Choose your response")}</small>}
              </button>
            </div>
          </aside>
        </section>
      )}

      {activePanel === "sender" && <SenderInspector scenario={scenario} onClose={() => setActivePanel(null)} />}
      {activePanel === "link" && (
        <LinkInspector scenario={scenario} onClose={() => setActivePanel(null)} onOpenLink={() => {
          recordInvestigation("openLink", null);
          setBrowserVisible(true);
        }} />
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
