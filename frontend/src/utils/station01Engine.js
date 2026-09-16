import { SMS_SCENARIOS } from "../data/smsScenarios.js";
import { applyAction } from "./scoringEngine.js";

const DEPARTMENTS = ["Finance", "Operations", "People Services", "IT", "Facilities", "Procurement"];
const SYSTEMS = ["Atlas Portal", "Nexus Workspace", "Mercury Mail", "Orion Files"];

function getRandomInt(max) {
  if (max <= 0) return 0;
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function pick(items) {
  return items[getRandomInt(items.length)];
}

function makeReference(prefix = "REF") {
  const number = 1000 + getRandomInt(8999);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `${prefix}-${letters[getRandomInt(letters.length)]}${number}`;
}

function makeTimestamp() {
  const hour = 9 + getRandomInt(6);
  const minute = String(5 + getRandomInt(54)).padStart(2, "0");
  const displayHour = hour > 12 ? hour - 12 : hour;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${minute} ${suffix}`;
}

function makeMaintenanceWindow() {
  const windows = ["tonight at 8:30 PM", "tomorrow at 7:00 AM", "Thursday at 6:45 PM", "Sunday at 7:30 AM"];
  return pick(windows);
}

function applyTemplate(template, variables) {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || "");
}

export function getScenarioById(scenarioId) {
  return SMS_SCENARIOS.find((scenario) => scenario.id === scenarioId) || null;
}

export function createStation01State(previousScenarioId) {
  const availableScenarios =
    SMS_SCENARIOS.length > 1 ? SMS_SCENARIOS.filter((scenario) => scenario.id !== previousScenarioId) : SMS_SCENARIOS;
  const scenario = pick(availableScenarios);
  const variables = {
    deadline: pick(["2:00 PM", "end of day", "the next hour", "today"]),
    department: pick(DEPARTMENTS),
    maintenanceWindow: makeMaintenanceWindow(),
    reference: makeReference(scenario.classification === "phishing" ? "SEC" : "REF"),
    systemName: pick(SYSTEMS),
    ticketNumber: makeReference("INC"),
    year: "2026"
  };
  const message = applyTemplate(pick(scenario.messageTemplates), variables);
  const link = scenario.link.exists
    ? {
        exists: true,
        displayText: pick(scenario.link.displayTexts),
        destination: pick(scenario.link.destinations),
        sourceLabel: scenario.link.sourceLabel
      }
    : { exists: false };

  return {
    scenarioId: scenario.id,
    assignedAt: new Date().toISOString(),
    receivedAt: makeTimestamp(),
    senderName: pick(scenario.sender.names),
    senderDisplayNumber: scenario.sender.displayNumber,
    message,
    link,
    senderInspected: false,
    linkInspected: false,
    messageDetailsViewed: false,
    linkOpened: false,
    senderBlocked: false,
    messageDeleted: false,
    finalAction: null,
    completedAt: null,
    timeSpentSeconds: null,
    timedOut: false
  };
}

export function getParticipantScenario(station01State) {
  const scenario = getScenarioById(station01State?.scenarioId);

  if (!scenario || !station01State) {
    return null;
  }

  return {
    id: scenario.id,
    sender: {
      name: station01State.senderName,
      displayNumber: station01State.senderDisplayNumber,
      sourceType: scenario.sender.sourceType,
      verificationLabel: scenario.sender.verificationLabel
    },
    message: station01State.message,
    timestamp: station01State.receivedAt,
    link: station01State.link,
    difficulty: scenario.difficulty
  };
}

export function ensureStation01State(mission, previousScenarioId) {
  if (mission.decisions?.station01?.scenarioId) {
    return mission;
  }

  return {
    ...mission,
    decisions: {
      ...mission.decisions,
      station01: createStation01State(previousScenarioId)
    },
    updatedAt: new Date().toISOString()
  };
}

function patchStation01(mission, patch) {
  return {
    ...mission,
    decisions: {
      ...mission.decisions,
      station01: {
        ...mission.decisions.station01,
        ...patch
      }
    },
    updatedAt: new Date().toISOString()
  };
}

export function recordStation01Investigation(mission, actionName) {
  const station01 = mission.decisions.station01;

  if (station01.completedAt || station01.timedOut) {
    return mission;
  }

  const patchByAction = {
    inspectSender: { senderInspected: true },
    inspectLink: { linkInspected: true },
    viewDetails: { messageDetailsViewed: true }
  };
  const scoreActionByAction = {
    inspectSender: "STATION01_INSPECT_SENDER",
    inspectLink: "STATION01_INSPECT_LINK",
    viewDetails: "STATION01_VIEW_DETAILS"
  };
  const patch = patchByAction[actionName];

  if (!patch) {
    return mission;
  }

  const wasAlreadyRecorded = Object.keys(patch).every((key) => station01[key]);
  const patchedMission = patchStation01(mission, patch);

  if (wasAlreadyRecorded) {
    return patchedMission;
  }

  return applyAction(patchedMission, scoreActionByAction[actionName], {
    stationKey: "station01",
    scenarioId: station01.scenarioId
  });
}

export function completeStation01(mission, finalAction) {
  const station01 = mission.decisions.station01;
  const scenario = getScenarioById(station01.scenarioId);

  if (!scenario || station01.completedAt || station01.timedOut) {
    return mission;
  }

  const completedAt = new Date().toISOString();
  const timeSpentSeconds = Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(station01.assignedAt).getTime()) / 1000));
  let scoreAction = "STATION01_NEUTRAL_DECISION";
  let extraPatch = {};

  if (finalAction === "openLink") {
    scoreAction =
      scenario.classification === "phishing" ? "OPEN_PHISHING_LINK" : "STATION01_OPEN_LEGITIMATE_LINK";
    extraPatch = { linkOpened: true };
  }

  if (finalAction === "report") {
    scoreAction =
      scenario.classification === "phishing" ? "CORRECT_PHISHING_REPORT" : "INCORRECT_LEGITIMATE_REPORT";
  }

  if (finalAction === "continue") {
    scoreAction =
      scenario.classification === "legitimate" ? "CORRECT_LEGITIMATE_CONTINUE" : "STATION01_DISMISS_PHISHING";
  }

  if (finalAction === "delete") {
    scoreAction =
      scenario.classification === "phishing" ? "DELETE_PHISHING_WITHOUT_REPORT" : "STATION01_DELETE_LEGITIMATE";
    extraPatch = { messageDeleted: true };
  }

  if (finalAction === "block") {
    scoreAction =
      scenario.classification === "phishing" ? "STATION01_BLOCK_PHISHING_WITHOUT_REPORT" : "STATION01_BLOCK_LEGITIMATE";
    extraPatch = { senderBlocked: true };
  }

  const completedMission = patchStation01(mission, {
    ...extraPatch,
    finalAction,
    completedAt,
    timeSpentSeconds
  });
  const scoredMission = applyAction(completedMission, scoreAction, {
    stationKey: "station01",
    scenarioId: station01.scenarioId,
    finalAction
  });

  return {
    ...scoredMission,
    completedStations: Array.from(new Set([...scoredMission.completedStations, 1])),
    updatedAt: new Date().toISOString()
  };
}

export function expireStation01(mission) {
  const station01 = mission.decisions.station01;

  if (station01.completedAt || station01.timedOut) {
    return mission;
  }

  const timedOutMission = patchStation01(mission, {
    finalAction: "timedOut",
    timedOut: true,
    completedAt: new Date().toISOString()
  });

  return {
    ...applyAction(timedOutMission, "STATION01_TIME_EXPIRED", {
      stationKey: "station01",
      scenarioId: station01.scenarioId
    }),
    status: "timed-out",
    updatedAt: new Date().toISOString()
  };
}

