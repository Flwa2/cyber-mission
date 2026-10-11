# Progressive scoring (action-5000-v1)

The authoritative total is the private booth record `scoring.total`, keyed by Mission ID.
`scoring.stations` contains immutable completion snapshots and maxima; total is a sum,
never an incremental client award. Each snapshot is persisted in the same transaction
as the existing station handoff. No score is published to gameplay yet.

Maximum 5,000: Station01 1,000; Station02 1,000; Station03 investigation 900 plus
financial challenge 600; Station04 1,500. This policy supersedes the older connected-case
1,000-point model. `scoreCase` remains only for legacy direct resolution/fixtures;
its result and frontend `hiddenScore` are never added to the progressive total.

- S01: sender/details/link review 100 each (details substitute for absent link).
  Phishing report 700, block 350, delete 200, continue/open -200.
  Legitimate continue 700, open 500, delete 100, block/report -100.
  Any recorded malicious link opening deducts 400, including before a later report.
  Scenario/link existence comes from canonical definitions, not client totals.
- S02: USB/badge/documents 200 each, cable/QR 150 each, power bank 100.
  Report/secure earns the item maximum. Leave earns respectively 120/40/20/105/105/70.
  Unsafe connect/use/scan deducts the item's maximum; reading documents deducts 150.
  Unanswered objects earn zero, even though only three decisions are needed to proceed.
- S03: distribute 900 among unique relevant records in the private per-mission snapshot.
  Integer remainder is assigned in stable ID order. Final selected valid IDs earn their
  allocations; missing clues earn zero; each final irrelevant record deducts 60.
  Repeated selections earn nothing extra. Removed evidence has no final penalty.
  The challenge spreadsheet is excluded from incident evidence.
- Financial: unchanged backend answer keys, 200 for each of the three confirmed correct
  answers. No points for merely opening/reading; exactly once in Station03's snapshot.
- S04: correct attribution 500, notifying cybersecurity 500, preserving evidence 500.
  Investigating alone earns 200; changing settings earns 100. Destructive or disclosure
  choices deduct 150 each. Wrong person earns zero. Only the current three-response
  model is counted. Its private score and progressive contribution use one scorer.

All station totals are rounded/clamped to zero through their budget. The investigation
and financial components are independently bounded at 900/600. Final choices are used;
no sequence is inferred from transient response selections. S01 exposure/inspection
booleans are monotonic on accepted syncs. S02 actions are already immutable.

An unfinished/timed-out station awards nothing; previous finalized awards remain.
Existing in-progress missions recover earlier completed station scores at the next
completion using recorded decisions. Existing completed missions are not bulk migrated.
Ancient S03 records without a financial challenge snapshot and old S04 timeline answers
cannot be interpreted as the new questions; they are not awarded new-model points.
S01 still reports decisions through its existing browser snapshot transport: the server
computes points, but this is not proof of a human interaction or an anti-cheat event log.

Tests: `node backend/scripts/validateProgressiveScoring.mjs` (isolated JSON store/API).
