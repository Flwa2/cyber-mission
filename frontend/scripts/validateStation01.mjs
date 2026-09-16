import { SMS_SCENARIOS } from "../src/data/smsScenarios.js";
import {
  completeStation01,
  createStation01State,
  getParticipantScenario,
  recordStation01Investigation
} from "../src/utils/station01Engine.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMissionForScenario(scenarioId) {
  const now = new Date().toISOString();
  const scenario = SMS_SCENARIOS.find((item) => item.id === scenarioId);

  return {
    missionId: "CM-TEST01",
    createdAt: now,
    startedAt: now,
    updatedAt: now,
    status: "active",
    currentStation: 1,
    completedStations: [],
    hiddenScore: 0,
    hiddenAttackState: 0,
    evidence: [],
    decisions: {
      station01: {
        scenarioId,
        assignedAt: now,
        receivedAt: "10:42 AM",
        senderName: scenario.sender.names[0],
        senderDisplayNumber: scenario.sender.displayNumber,
        message: "Validation message",
        link: scenario.link.exists
          ? {
              exists: true,
              displayText: scenario.link.displayTexts[0],
              destination: scenario.link.destinations[0],
              sourceLabel: scenario.link.sourceLabel
            }
          : { exists: false },
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
      }
    },
    flags: {
      suspiciousLinkOpened: false,
      accountExposurePossible: false,
      phishingReported: false,
      legitimateMessageReported: false,
      unknownUsbConnected: false,
      physicalThreatContained: false,
      criticalEvidenceMissed: false,
      incidentReported: false
    }
  };
}

const phishingScenario = SMS_SCENARIOS.find((scenario) => scenario.classification === "phishing");
const legitimateScenario = SMS_SCENARIOS.find((scenario) => scenario.classification === "legitimate");

assert(SMS_SCENARIOS.filter((scenario) => scenario.classification === "phishing").length >= 6, "Expected at least 6 phishing scenarios");
assert(SMS_SCENARIOS.filter((scenario) => scenario.classification === "legitimate").length >= 6, "Expected at least 6 legitimate scenarios");

let pathA = createMissionForScenario(phishingScenario.id);
pathA = recordStation01Investigation(pathA, "inspectSender");
pathA = recordStation01Investigation(pathA, "inspectLink");
pathA = completeStation01(pathA, "report");
assert(pathA.decisions.station01.senderInspected, "Path A should record sender inspection");
assert(pathA.decisions.station01.linkInspected, "Path A should record link inspection");
assert(pathA.flags.phishingReported, "Path A should record phishing report flag");
assert(pathA.completedStations.includes(1), "Path A should complete Station 01");

let pathB = createMissionForScenario(phishingScenario.id);
pathB = completeStation01(pathB, "openLink");
assert(pathB.flags.suspiciousLinkOpened, "Path B should record suspicious link opened");
assert(pathB.flags.accountExposurePossible, "Path B should record possible account exposure");
assert(pathB.hiddenAttackState > 0, "Path B should increase hidden attack state");

let pathC = createMissionForScenario(legitimateScenario.id);
pathC = recordStation01Investigation(pathC, "inspectSender");
pathC = completeStation01(pathC, "continue");
assert(pathC.decisions.station01.senderInspected, "Path C should record sender inspection");
assert(pathC.hiddenScore > 0, "Path C should award hidden score for correct legitimate handling");
assert(!pathC.flags.legitimateMessageReported, "Path C should not report legitimate message");

let pathD = createMissionForScenario(legitimateScenario.id);
pathD = completeStation01(pathD, "report");
assert(pathD.flags.legitimateMessageReported, "Path D should record legitimate message report");
assert(pathD.hiddenScore < 0, "Path D should apply hidden penalty for incorrect report");

let duplicateCheck = createMissionForScenario(phishingScenario.id);
duplicateCheck = recordStation01Investigation(duplicateCheck, "inspectSender");
const scoreAfterFirstInspect = duplicateCheck.hiddenScore;
duplicateCheck = recordStation01Investigation(duplicateCheck, "inspectSender");
assert(duplicateCheck.hiddenScore === scoreAfterFirstInspect, "Repeated inspection should not score twice");
duplicateCheck = completeStation01(duplicateCheck, "report");
const completedDecision = duplicateCheck.decisions.station01.finalAction;
duplicateCheck = completeStation01(duplicateCheck, "openLink");
assert(duplicateCheck.decisions.station01.finalAction === completedDecision, "Completed Station 01 should not accept another decision");

const stateA = createStation01State();
const stateB = createStation01State(stateA.scenarioId);
assert(stateA.scenarioId !== stateB.scenarioId, "New mission should avoid immediate scenario repeat when practical");
const participantScenario = getParticipantScenario(stateB);
assert(participantScenario.id === stateB.scenarioId, "Participant scenario should resolve from stored scenario id");
assert(!Object.hasOwn(participantScenario, "classification"), "Participant scenario must not expose classification");

console.log("Station 01 validation passed");

