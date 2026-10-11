// Fictional scenarios. Example domains and 202-555-01xx numbers are reserved for examples.
export const SMS_SCENARIOS = [
  {
    "id": "SMS-PHISH-001",
    "classification": "phishing",
    "category": "IT support verification",
    "difficulty": "hard",
    "sender": {
      "names": [
        "IT Support",
        "Support Desk"
      ],
      "displayNumber": "Service Updates",
      "sourceType": "external",
      "verificationLabel": "IT Service Desk"
    },
    "messageTemplates": [
      "Your support request {ticketNumber} needs a final review. Please check the request summary:",
      "An update is available for your support request {ticketNumber}. Review the summary:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://support.example.com/review"
      ],
      "destinations": [
        "https://support-check.example.net/review"
      ],
      "sourceLabel": "https://support.example.com",
      "trusted": false
    },
    "messageContext": "You have no open support request. Your last request was closed last month.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-PHISH-002",
    "classification": "phishing",
    "category": "Employee benefits review",
    "difficulty": "hard",
    "sender": {
      "names": [
        "Employee Services",
        "Benefits Desk"
      ],
      "displayNumber": "Benefits Desk",
      "sourceType": "external",
      "verificationLabel": "People Services"
    },
    "messageTemplates": [
      "Your benefits summary is ready for review. Please acknowledge any changes in the employee services portal:",
      "Please review your benefits summary before the next enrollment window. The employee services notice is available here:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://people-update.example.net/summary"
      ],
      "destinations": [
        "https://people-update.example.net/summary"
      ],
      "sourceLabel": "https://people.example.com",
      "trusted": false
    },
    "messageContext": "You have not requested a benefits change. Your usual benefits notices appear in the employee portal.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-PHISH-003",
    "classification": "phishing",
    "category": "Delivery rescheduling fee",
    "difficulty": "easy",
    "sender": {
      "names": [
        "Delivery Updates",
        "Parcel Service"
      ],
      "displayNumber": "+1 202 555 0141",
      "sourceType": "external",
      "verificationLabel": "Parcel Alerts"
    },
    "messageTemplates": [
      "Your office delivery needs rescheduling. Pay a small handling fee before selecting another slot:",
      "A new delivery slot is available for your office parcel. A handling fee is required to confirm it:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://ordar.example.net/reschedule"
      ],
      "destinations": [
        "https://ordar.example.net/payment"
      ],
      "sourceLabel": "https://order.example.com",
      "trusted": false
    },
    "messageContext": "You are not expecting a parcel. Office delivery charges are normally handled by purchasing.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-PHISH-004",
    "classification": "phishing",
    "category": "MFA approval request without a link",
    "difficulty": "easy",
    "sender": {
      "names": [
        "Access Support",
        "Account Support"
      ],
      "displayNumber": "+1 202 555 0112",
      "sourceType": "external",
      "verificationLabel": "IT Service Desk"
    },
    "messageTemplates": [
      "To finish a routine account check, approve the next sign-in prompt even if you did not start it. No reply is needed.",
      "We are completing an account check. Please approve the next authentication prompt; you do not need to start a sign-in."
    ],
    "link": {
      "exists": false
    },
    "messageContext": "You did not start a sign-in or ask for account help. The message asks you to approve a prompt anyway.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-PHISH-005",
    "classification": "phishing",
    "category": "Meeting agenda invitation",
    "difficulty": "medium",
    "sender": {
      "names": [
        "Meeting Desk",
        "Board Scheduling"
      ],
      "displayNumber": "Calendar Notices",
      "sourceType": "external",
      "verificationLabel": "Workplace Scheduling"
    },
    "messageTemplates": [
      "The agenda for your planning meeting is available. Please review it before attending:",
      "A planning meeting agenda has been shared with you. Review the document ahead of the discussion:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://calendar.example.com/agenda"
      ],
      "destinations": [
        "https://meeting-review.example.net/agenda"
      ],
      "sourceLabel": "https://calendar.example.com",
      "trusted": false
    },
    "messageContext": "You have no invitation for this meeting on your calendar and have not spoken with its organizer.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-PHISH-006",
    "classification": "phishing",
    "category": "Shared payroll document",
    "difficulty": "hard",
    "sender": {
      "names": [
        "Finance Records",
        "Payroll Documents"
      ],
      "displayNumber": "Document Notices",
      "sourceType": "external",
      "verificationLabel": "Payroll Services; this file was shared by someone outside your organization using the name Finance Records."
    },
    "messageTemplates": [
      "Finance Records shared a compensation worksheet with you. Review the document when convenient:",
      "A compensation worksheet has been shared for your review by Finance Records. View the document:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://files.example.com/shared/payroll"
      ],
      "destinations": [
        "https://files.example.com/shared/payroll"
      ],
      "sourceLabel": "https://files.example.com",
      "trusted": false
    },
    "messageContext": "You are not expecting a compensation review. The file asks you to change your bank details; you normally do that in the employee portal.",
    "expectedDecision": "report",
    "futureFlags": {
      "accountExposurePossible": true
    }
  },
  {
    "id": "SMS-LEGIT-001",
    "classification": "legitimate",
    "category": "Internal service interruption",
    "difficulty": "easy",
    "sender": {
      "names": [
        "Platform Services",
        "IT Notifications"
      ],
      "displayNumber": "IT Updates",
      "sourceType": "internal",
      "verificationLabel": "IT Updates"
    },
    "messageTemplates": [
      "{systemName} will be unavailable {maintenanceWindow}. Save your work before maintenance begins.",
      "Planned maintenance for {systemName}: {maintenanceWindow}. Please save open work beforehand."
    ],
    "link": {
      "exists": false
    },
    "messageContext": "You use this service. The same maintenance time is posted on the staff noticeboard.",
    "expectedDecision": "continue"
  },
  {
    "id": "SMS-LEGIT-002",
    "classification": "legitimate",
    "category": "IT support ticket update",
    "difficulty": "medium",
    "sender": {
      "names": [
        "Support Updates",
        "IT Service Desk"
      ],
      "displayNumber": "Service Updates",
      "sourceType": "external",
      "verificationLabel": "Service Updates"
    },
    "messageTemplates": [
      "Your support request {ticketNumber} has an update. Please review the technician's note before the ticket closes:",
      "A technician added a note to your request {ticketNumber}. View the update in the service portal:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://support.example.com/ticket"
      ],
      "destinations": [
        "https://support.example.com/ticket"
      ],
      "sourceLabel": "https://support.example.com",
      "trusted": true
    },
    "messageContext": "You opened a support request today and chose SMS updates. Your ticket now has a technician note.",
    "expectedDecision": "continue"
  },
  {
    "id": "SMS-LEGIT-003",
    "classification": "legitimate",
    "category": "Building maintenance",
    "difficulty": "easy",
    "sender": {
      "names": [
        "Facilities",
        "Building Services"
      ],
      "displayNumber": "Facilities Notices",
      "sourceType": "internal",
      "verificationLabel": "Facilities Notices"
    },
    "messageTemplates": [
      "Maintenance near {department} is scheduled for {maintenanceWindow}. Use the signed alternative entrance during the work.",
      "Building work affects access near {department} {maintenanceWindow}. Follow the posted alternative route."
    ],
    "link": {
      "exists": false
    },
    "messageContext": "A notice at the building entrance lists the same work and alternative entrance.",
    "expectedDecision": "continue"
  },
  {
    "id": "SMS-LEGIT-004",
    "classification": "legitimate",
    "category": "Package delivery management",
    "difficulty": "medium",
    "sender": {
      "names": [
        "Parcel Service",
        "Delivery Updates"
      ],
      "displayNumber": "+1 202 555 0144",
      "sourceType": "external",
      "verificationLabel": "+1 202 555 0144 (on your order confirmation)"
    },
    "messageTemplates": [
      "Your office parcel is scheduled for delivery today. Review the delivery window or select a receiving option:",
      "A delivery window is available for your office parcel. Review the receiving options before dispatch:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://order.example.com/delivery"
      ],
      "destinations": [
        "https://order.example.com/delivery"
      ],
      "sourceLabel": "https://order.example.com",
      "trusted": true
    },
    "messageContext": "You ordered office supplies and chose delivery texts. Your order confirmation shows a delivery today.",
    "expectedDecision": "continue"
  },
  {
    "id": "SMS-LEGIT-005",
    "classification": "legitimate",
    "category": "Workplace event registration",
    "difficulty": "medium",
    "sender": {
      "names": [
        "Workplace Events",
        "Event Registration"
      ],
      "displayNumber": "Event Notices",
      "sourceType": "external",
      "verificationLabel": "Event Notices (on your booking receipt)"
    },
    "messageTemplates": [
      "Please confirm your workshop attendance before the registration window closes. Your booking is available here:",
      "Your workplace workshop booking is awaiting attendance confirmation. Review your registration:"
    ],
    "link": {
      "exists": true,
      "displayTexts": [
        "https://events.example.org/booking"
      ],
      "destinations": [
        "https://events.example.org/booking"
      ],
      "sourceLabel": "https://events.example.org",
      "trusted": true
    },
    "messageContext": "You booked a workshop yesterday. Your receipt says the event organizer will text you to confirm attendance.",
    "expectedDecision": "continue"
  },
  {
    "id": "SMS-LEGIT-006",
    "classification": "legitimate",
    "category": "Employee services appointment",
    "difficulty": "medium",
    "sender": {
      "names": [
        "Employee Services",
        "People Operations"
      ],
      "displayNumber": "People Services",
      "sourceType": "internal",
      "verificationLabel": "People Services"
    },
    "messageTemplates": [
      "Your employee services appointment has moved to the next available slot. Check the employee portal before travelling to the office.",
      "Employee services updated your appointment time. Review the revised slot in the employee portal before attending."
    ],
    "link": {
      "exists": false
    },
    "messageContext": "You booked an employee services appointment and chose text reminders. The employee portal shows the revised appointment time.",
    "expectedDecision": "continue"
  }
];
