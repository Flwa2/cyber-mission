export const ACTION_RULES = {
  INSPECT_SENDER: {
    scoreDelta: 5
  },
  OPEN_PHISHING_LINK: {
    scoreDelta: -20,
    attackStateDelta: 20,
    flags: {
      suspiciousLinkOpened: true,
      accountExposurePossible: true
    }
  },
  REPORT_PHISHING: {
    scoreDelta: 20,
    flags: {
      phishingReported: true,
      incidentReported: true
    }
  },
  CONNECT_UNKNOWN_USB: {
    scoreDelta: -20,
    attackStateDelta: 25,
    flags: {
      unknownUsbConnected: true
    }
  },
  COLLECT_VALID_EVIDENCE: {
    scoreDelta: 10
  }
};
