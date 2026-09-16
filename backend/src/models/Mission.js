export function createMissionRecord({ missionId }) {
  const now = new Date().toISOString();

  return {
    missionId,
    createdAt: now,
    startedAt: now,
    updatedAt: now,
    status: "active",
    currentStation: 1,
    completedStations: [],
    hiddenScore: 0,
    hiddenAttackState: 0,
    evidence: [],
    decisions: {},
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
