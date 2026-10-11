# Station 03: investigation mail and data-sharing challenge

Every newly generated Station 03 inbox includes two fictional phishing messages (STC and Al Rajhi Bank) and an ordinary Workplace Services message, alongside the case correspondence. Phishing senders and destinations use reserved `.invalid` domains; the UI never navigates to them. All three messages are inspect-only red herrings and do not change incident evidence or the Station 04 handoff.

After the existing workstation investigation, Station 03 presents three ordered workshop questions inside the virtual workstation. Each question has its own bilingual email/request context card; the unrelated financial worksheet is not shown in this interface.

## Questions

1. Which data classification level allows sharing outside the Fund without an agreement? Correct answer: `public`.
2. Which department requests data from outside the Fund for an active project? Correct answer: `data-management-office`.
3. How should data be shared with a trusted friend at another government entity? Correct answer: `contact-data-management-office`.

Each question has four answer choices, and each correct answer earns 200 points (600 total). The card beside each question is contextual material only; it does not reveal the answer or add evidence, scoring, or required steps.

## Development preview

With the Vite development server running, preview the real Station 03 component at `/?deviceStation=3&devPreview=station03&phase=classification&lang=en` or change `lang` to `ar`. The preview adapter uses the backend scenario content and local-only answer state; it does not connect to or modify booth mission data.

## Versioning and persistence

The backend assigns a `station03Experience.dataChallenge` snapshot. Stable IDs (`q1-public-classification`, `q2-request-external-data`, `q3-trusted-friend-sharing`) identify the current questions independently of language. Existing saved missions keep their stored challenge, answers, and score; new content applies when a new investigation is generated. The public projection omits expected answers and private scores.

Answers are accepted in order through the existing Station 03 investigation endpoint using action `answer`. `mission.decisions.station03.dataDecisions.answers[questionId]` stores the selected answer ID and confirmation timestamp. Refresh, restart, and lease recovery resume at the first unanswered question.

Legacy version 1 challenge snapshots, decisions, and private scores are archived privately during migration. When Station 03 decision state exists, the archive is stored under `mission.decisions.station03.legacyDataChallenge`; before the first Station 03 action, it stays on the private mission record. The archive is not displayed or included in public mission responses. Other mission decisions, selected investigation evidence, the global timer, and the Station 04 handoff are preserved.

## Scoring and validation

Only exact backend-owned answer IDs earn points. The private score is capped at 600 points and is not exposed to the participant; it retains the existing Station 03 allocation and does not change the overall 5,000-point mission maximum.

Backend checks cover all 64 combinations of four choices per question, ordering, invalid/duplicate answers, private projections, migration, refresh/restart/lease recovery, new mail in case-backed inbox projections, unchanged mission scoring, and Station 04 handoff.
