# Station 03: investigation and data-sharing challenge

Station 03 retains the existing workstation investigation, mission-scoped records, optional evidence collection, shared HUD, eight-minute mission timer, and Station 04 handoff. The post-investigation three-question data-sharing challenge is documented in [station03-data-sharing.md](station03-data-sharing.md).

## Investigation and handoff

The participant can inspect, add, or remove Station 03 evidence before choosing **Finish Investigation**. Existing selected evidence is persisted in the usual Station 03 decision and mission evidence structures. The classification challenge no longer displays the unrelated financial worksheet. The three newly authored phishing and ordinary messages are inspect-only distractors, not incident evidence, and are never included in the Station 04 handoff; existing case correspondence and selected incident evidence remain intact.

The challenge is rendered within the workstation rather than replacing it with a separate screen. Each question has its own bilingual email/request context card beside the four answer options. English and Arabic presentations use the same stable backend-owned question and answer IDs.

## Existing workplace content

The existing investigation evidence, conditional Station 01/02 clues, aliases, document viewer, device/activity records, evidence collection rules, and incident-relevance signals are preserved. Three inspect-only mailbox messages are added as unrelated awareness distractors. Evidence remains participant-selected; beginning the challenge does not add or remove investigation evidence.

The first question uses the four classification-level options. The second asks who requests external data for an active project, and the third asks about a trusted colleague’s request for data. Their answer IDs reflect their distinct answer types.

## Recovery and scoring

Station 03 experience snapshots and answer decisions are persisted by the existing booth transaction and survive refresh, restart, and lease recovery. The three questions award 200 points each for a 600-point total, preserving the existing Station 03 allocation and overall 5,000-point mission maximum.

Older version 1 two-document challenge data is archived privately during migration, not treated as answers to the new questions. The archive remains hidden when returned through public mission APIs. Investigation evidence and unrelated decisions are preserved. Completed Station 03 missions are not reopened.

Run `npm test` in both `backend` and `frontend`, and `npm run build` in `frontend` to validate the current implementation.
