export const ACTION_RULES = {
  INSPECT_SENDER: {
    scoreDelta: 5
  },
  STATION01_INSPECT_SENDER: {
    scoreDelta: 10,
    oncePerMission: true
  },
  STATION01_INSPECT_LINK: {
    scoreDelta: 15,
    oncePerMission: true
  },
  STATION01_VIEW_DETAILS: {
    scoreDelta: 5,
    oncePerMission: true
  },
  OPEN_PHISHING_LINK: {
    scoreDelta: -100,
    attackStateDelta: 45,
    oncePerMission: true,
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
  CORRECT_PHISHING_REPORT: {
    scoreDelta: 100,
    attackStateDelta: -10,
    oncePerMission: true,
    flags: {
      phishingReported: true,
      incidentReported: true
    }
  },
  CORRECT_LEGITIMATE_CONTINUE: {
    scoreDelta: 100,
    oncePerMission: true
  },
  INCORRECT_LEGITIMATE_REPORT: {
    scoreDelta: -30,
    oncePerMission: true,
    flags: {
      legitimateMessageReported: true,
      incidentReported: true
    }
  },
  DELETE_PHISHING_WITHOUT_REPORT: {
    scoreDelta: -20,
    attackStateDelta: 10,
    oncePerMission: true,
    flags: {
      criticalEvidenceMissed: true
    }
  },
  STATION01_DISMISS_PHISHING: {
    scoreDelta: -40,
    attackStateDelta: 20,
    oncePerMission: true,
    flags: {
      criticalEvidenceMissed: true
    }
  },
  STATION01_BLOCK_PHISHING_WITHOUT_REPORT: {
    scoreDelta: -10,
    attackStateDelta: 8,
    oncePerMission: true
  },
  STATION01_DELETE_LEGITIMATE: {
    scoreDelta: -10,
    oncePerMission: true
  },
  STATION01_BLOCK_LEGITIMATE: {
    scoreDelta: -20,
    oncePerMission: true
  },
  STATION01_OPEN_LEGITIMATE_LINK: {
    scoreDelta: 0,
    oncePerMission: true
  },
  STATION01_NEUTRAL_DECISION: {
    scoreDelta: 0,
    oncePerMission: true
  },
  STATION01_TIME_EXPIRED: {
    scoreDelta: -25,
    oncePerMission: true
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
