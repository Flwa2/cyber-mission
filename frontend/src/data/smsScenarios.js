export const SMS_SCENARIOS = [
  {
    id: "SMS-PHISH-001",
    classification: "phishing",
    category: "Fake IT account verification",
    sender: {
      names: ["IT Support", "Account Services", "Access Desk"],
      displayNumber: "+966 55 742 0186",
      sourceType: "external",
      verificationLabel: "Not verified through corporate messaging"
    },
    messageTemplates: [
      "We detected unusual access activity on your corporate account. Review your account before {deadline}. Ref {reference}.",
      "Your account requires verification after a security notice. Review access status before {deadline}. Ref {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Review Account", "Verify Access"],
      destinations: ["account-check.example", "access-review.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "medium",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-PHISH-002",
    classification: "phishing",
    category: "Fake HR benefits notification",
    sender: {
      names: ["HR Benefits", "People Rewards", "Benefits Desk"],
      displayNumber: "+966 54 803 2197",
      sourceType: "external",
      verificationLabel: "External number not linked to HR notifications"
    },
    messageTemplates: [
      "Your {year} benefits selection has a pending update. Confirm eligibility by {deadline}. Case {reference}.",
      "A benefits document is waiting for review. Confirm your details before {deadline}. Case {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Open Benefits Notice", "Confirm Benefits"],
      destinations: ["people-benefits.example", "benefits-update.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "medium",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-PHISH-003",
    classification: "phishing",
    category: "Fake delivery notification",
    sender: {
      names: ["Courier Desk", "Package Notice", "Delivery Update"],
      displayNumber: "+966 50 419 6628",
      sourceType: "external",
      verificationLabel: "External number with no corporate delivery record"
    },
    messageTemplates: [
      "A parcel for {department} is waiting for address confirmation. Update delivery details by {deadline}. Ref {reference}.",
      "Delivery to your office is on hold. Confirm recipient details before {deadline}. Ref {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Confirm Delivery", "Update Details"],
      destinations: ["office-delivery.example", "parcel-confirm.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "easy",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-PHISH-004",
    classification: "phishing",
    category: "Fake MFA re-enrollment",
    sender: {
      names: ["MFA Center", "Security Enrollment", "Access Verification"],
      displayNumber: "+966 56 031 8452",
      sourceType: "external",
      verificationLabel: "External number outside approved security channel"
    },
    messageTemplates: [
      "MFA enrollment expires today for your workstation access. Re-enroll before {deadline}. Ticket {reference}.",
      "Your security token needs re-enrollment to avoid access interruption. Complete by {deadline}. Ticket {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Re-enroll MFA", "Update Token"],
      destinations: ["mfa-renew.example", "secure-token.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "hard",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-PHISH-005",
    classification: "phishing",
    category: "Fake urgent meeting invitation",
    sender: {
      names: ["Executive Office", "Board Scheduling", "Meeting Desk"],
      displayNumber: "+966 53 684 2901",
      sourceType: "external",
      verificationLabel: "External sender not verified as an executive channel"
    },
    messageTemplates: [
      "A confidential meeting brief was shared with {department}. Open the invitation before {deadline}. Ref {reference}.",
      "You were added to an urgent leadership briefing. Review the agenda before {deadline}. Ref {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Review Invitation", "Open Agenda"],
      destinations: ["meeting-brief.example", "agenda-review.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "hard",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-PHISH-006",
    classification: "phishing",
    category: "Fake payroll document notification",
    sender: {
      names: ["Payroll Documents", "Finance Records", "Salary Services"],
      displayNumber: "+966 58 217 9044",
      sourceType: "external",
      verificationLabel: "External number not used for payroll communications"
    },
    messageTemplates: [
      "Your salary adjustment document is ready. Review the file before {deadline}. Document {reference}.",
      "A payroll document requires acknowledgement. Open the secure file before {deadline}. Document {reference}."
    ],
    link: {
      exists: true,
      displayTexts: ["Open Document", "Review Payroll File"],
      destinations: ["payroll-file.example", "finance-records.example"],
      sourceLabel: "External destination",
      trusted: false
    },
    expectedDecision: "report",
    difficulty: "medium",
    futureFlags: {
      accountExposurePossible: true
    }
  },
  {
    id: "SMS-LEGIT-001",
    classification: "legitimate",
    category: "IT maintenance notification",
    sender: {
      names: ["IT Service Desk", "Service Desk", "IT Notifications"],
      displayNumber: "Service Desk",
      sourceType: "internal",
      verificationLabel: "Approved internal messaging channel"
    },
    messageTemplates: [
      "Network maintenance is scheduled for {maintenanceWindow}. No action is required. Notice {reference}.",
      "Reminder: planned service maintenance will occur {maintenanceWindow}. No action is required. Notice {reference}."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "easy"
  },
  {
    id: "SMS-LEGIT-002",
    classification: "legitimate",
    category: "Resolved service ticket",
    sender: {
      names: ["IT Service Desk", "Helpdesk Updates", "Support Desk"],
      displayNumber: "Service Desk",
      sourceType: "internal",
      verificationLabel: "Approved internal service channel"
    },
    messageTemplates: [
      "Ticket {ticketNumber} has been resolved. No further action is required.",
      "Your support request {ticketNumber} is now closed. Reply through the service portal if the issue continues."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "medium"
  },
  {
    id: "SMS-LEGIT-003",
    classification: "legitimate",
    category: "Facilities maintenance notice",
    sender: {
      names: ["Facilities", "Building Services", "Facilities Notice"],
      displayNumber: "Facilities",
      sourceType: "internal",
      verificationLabel: "Approved internal facilities channel"
    },
    messageTemplates: [
      "Facilities maintenance is scheduled near {department} on {maintenanceWindow}. Access routes may be adjusted.",
      "Building services will inspect the {department} area {maintenanceWindow}. No action is required."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "easy"
  },
  {
    id: "SMS-LEGIT-004",
    classification: "legitimate",
    category: "Approved leave notification",
    sender: {
      names: ["People Operations", "HR Services", "Leave Services"],
      displayNumber: "People Ops",
      sourceType: "internal",
      verificationLabel: "Approved internal HR messaging"
    },
    messageTemplates: [
      "Leave request {reference} has been approved. Details are available in the employee portal.",
      "Your time-off request {reference} was approved by your manager. No SMS reply is required."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "medium"
  },
  {
    id: "SMS-LEGIT-005",
    classification: "legitimate",
    category: "Internal awareness announcement",
    sender: {
      names: ["Security Awareness", "Cyber Awareness", "Security Office"],
      displayNumber: "Security Office",
      sourceType: "internal",
      verificationLabel: "Approved internal security channel"
    },
    messageTemplates: [
      "Security awareness reminder: verify unexpected links before opening them. Session {reference} begins {maintenanceWindow}.",
      "Cyber awareness briefing starts {maintenanceWindow}. Check the intranet calendar for room details. Ref {reference}."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "medium"
  },
  {
    id: "SMS-LEGIT-006",
    classification: "legitimate",
    category: "Scheduled system update",
    sender: {
      names: ["System Updates", "IT Change Notice", "Platform Services"],
      displayNumber: "IT Updates",
      sourceType: "internal",
      verificationLabel: "Approved internal change notification"
    },
    messageTemplates: [
      "{systemName} update is scheduled for {maintenanceWindow}. Save your work before the maintenance window.",
      "Planned update for {systemName}: {maintenanceWindow}. No credential confirmation is required."
    ],
    link: {
      exists: false
    },
    expectedDecision: "continue",
    difficulty: "hard"
  }
];

