import { getStationStatuses } from "../src/utils/stationStatus.js";
import { ACTIVE_SMS_SCENARIOS } from "../src/data/activeSmsScenarios.js";
import { SMS_SCENARIOS } from "../src/data/smsScenarios.js";
import { getLinkPreview } from "../src/data/linkPreviews.js";
import { scoreMessage } from "../../backend/src/progressiveScoring.js";
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
  const scenario = ACTIVE_SMS_SCENARIOS.find((item) => item.id === scenarioId);

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
        catalogVersion: "v2",
        assignedAt: now,
        receivedAt: "10:42 AM",
        senderName: scenario.sender.names[0].en,
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

const phishingScenario = ACTIVE_SMS_SCENARIOS.find((scenario) => scenario.classification === "phishing");
const legitimateScenario = ACTIVE_SMS_SCENARIOS.find((scenario) => scenario.classification === "legitimate");

assert(ACTIVE_SMS_SCENARIOS.filter((scenario) => scenario.classification === "phishing").length === 5, "Expected exactly 5 phishing scenarios");
assert(ACTIVE_SMS_SCENARIOS.filter((scenario) => scenario.classification === "legitimate").length === 5, "Expected exactly 5 legitimate scenarios");

assert(ACTIVE_SMS_SCENARIOS.length === 10, "Expected exactly 10 active SMS scenarios");
assert(ACTIVE_SMS_SCENARIOS.every((scenario) => scenario.link.exists), "Every active scenario must contain a link");
assert(ACTIVE_SMS_SCENARIOS.every((scenario) => getLinkPreview(scenario.id, "en")), "Every active scenario must have an English preview");
assert(ACTIVE_SMS_SCENARIOS.every((scenario) => getLinkPreview(scenario.id, "ar")), "Every active scenario must have an Arabic preview");
assert(SMS_SCENARIOS.length === 12, "Legacy catalog should remain available");
const initialMission = createMissionForScenario(phishingScenario.id);
assert(getStationStatuses(initialMission).map((station) => station.status).join() === "ACTIVE,WAITING,WAITING,WAITING", "New mission should activate only Station 01");

let pathA = createMissionForScenario(phishingScenario.id);
pathA = recordStation01Investigation(pathA, "inspectSender");
pathA = recordStation01Investigation(pathA, "inspectLink");
pathA = recordStation01Investigation(pathA, "viewDetails");
pathA = completeStation01(pathA, "report");
assert(pathA.decisions.station01.senderInspected, "Path A should record sender inspection");
assert(pathA.decisions.station01.linkInspected, "Path A should record link inspection");
assert(pathA.flags.phishingReported, "Path A should record phishing report flag");
assert(pathA.completedStations.includes(1), "Path A should complete Station 01");

assert(pathA.currentStation === 1, "Device 1 must stay at Station 01 after completion");
assert(getStationStatuses(pathA).map((station) => station.status).join() === "COMPLETED,READY,WAITING,WAITING", "Completion should ready only Station 02");
assert(scoreMessage(pathA.decisions.station01) === 1000, "Inspected phishing report without opening should score 1000");

let pathB = createMissionForScenario(phishingScenario.id);
pathB = recordStation01Investigation(pathB, "inspectSender");
pathB = recordStation01Investigation(pathB, "inspectLink");
pathB = recordStation01Investigation(pathB, "viewDetails");
pathB = recordStation01Investigation(pathB, "openLink");
pathB = completeStation01(pathB, "report");
assert(pathB.flags.suspiciousLinkOpened, "Path B should record suspicious link opened");
assert(pathB.flags.accountExposurePossible, "Path B should record possible account exposure");
assert(pathB.hiddenAttackState > 0, "Path B should increase hidden attack state");
assert(scoreMessage(pathB.decisions.station01) === 600, "Inspected phishing open then report should score 600");
pathB = recordStation01Investigation(pathB, "openLink");
assert(scoreMessage(pathB.decisions.station01) === 600, "Repeated phishing opens should not change the authoritative score");

let pathC = createMissionForScenario(legitimateScenario.id);
pathC = recordStation01Investigation(pathC, "inspectSender");
pathC = recordStation01Investigation(pathC, "inspectLink");
pathC = recordStation01Investigation(pathC, "viewDetails");
pathC = recordStation01Investigation(pathC, "openLink");
pathC = completeStation01(pathC, "continue");
assert(pathC.decisions.station01.senderInspected, "Path C should record sender inspection");
assert(pathC.hiddenScore > 0, "Path C should award hidden score for correct legitimate handling");
assert(!pathC.flags.legitimateMessageReported, "Path C should not report legitimate message");
assert(scoreMessage(pathC.decisions.station01) === 1000, "Inspected legitimate open then continue should score 1000");

let pathD = createMissionForScenario(legitimateScenario.id);
pathD = completeStation01(pathD, "report");
assert(pathD.flags.legitimateMessageReported, "Path D should record legitimate message report");
assert(pathD.hiddenScore > 0, "Path D should record the incorrect report action without affecting the approved scoring path");

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
const participantScenario = getParticipantScenario(stateB, "en");
assert(participantScenario.id === stateB.scenarioId, "Participant scenario should resolve from stored scenario id");
assert(!Object.hasOwn(participantScenario, "classification"), "Participant scenario must not expose classification");
assert(getParticipantScenario(stateB, "ar").message !== participantScenario.message, "Arabic and English messages should be distinct");

console.log("Station 01 validation passed");
