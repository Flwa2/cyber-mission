# Connected Cyber Mission cases

## Assignment and compatibility

The existing Station 01 sync transaction assigns a case on the first backend save of a recognized SMS scenario. A server-side shuffled bag selects each of the four cases once per rotation. The bag and a versioned snapshot of the selected definition live in the same JSON store as the mission. Subsequent sync, refresh, handoff, restart and lease recovery do not assign again. Client-supplied case IDs, content and results are ignored.

`backend/src/caseDefinitions.js` owns the four stories, physical clues, canonical sequence and containment requirements. `caseEngine.js` generates display records, evaluates saved decisions and creates the final reveal. `shared/casePeople.mjs` contains only public people and action labels; hidden solutions are not imported by the frontend.

Existing missions already beyond Station 01 are not silently rewritten or reset. They keep the earlier investigation/placeholder flow. Start a new mission to receive the connected case experience. No live booth records are migrated or deleted by this change.

## Four variants

| Variant | Connected account | Core correlation | Physical context |
| --- | --- | --- | --- |
| case-01 | Nora / WS-27 | OP-42 register, operations download, external sharing, deleted copy | Nora's badge; Reem checked printed totals |
| case-02 | Sami / WS-14 | Earlier benefits mail, account package, account access, forwarding rule | Mazen's returned badge; support note HR-18 |
| case-03 | Reem / WS-09 | Finance cover, export, external document link, deleted receipt | Sami's badge; printed reference FN-63 |
| case-04 | Mazen / WS-31 | Project handover, package, external upload, delivery receipt | Reem's badge; project reference PL-85 |

The pre-existing incident is anchored before mission start. Each person also has ordinary mail, documents and sign-in activity. A directory links all four accounts to workstations. The account correlation establishes the fictional game answer, not intent or legal guilt. Protected documents do not automatically count as relevant.

Station 01 retains all 12 scenarios and existing decisions. Recorded suspicious-link openings add later navigation records; they do not fabricate a download or login. Station 02 USB/peripheral records appear only after actual `connect` decisions. These later participant actions are explicitly separate from the historical case. Other desk objects do not invent digital events.

The supplied desk artwork is unchanged. Case-specific identities and references are displayed in the existing inspection panel rather than edited into the artwork.

## Evidence and resolution

Station 03 continues saving inspected/selected IDs and evidence through its existing endpoint. The server supplies the case-specific catalog to the same mutation helper. Selected records include stable IDs and internal relevance metadata in storage; public responses strip relevance and decision tags. Clients receive a display-only `caseFile` projection.

Station 04 uses `/stations/4/resolution` with the existing ownership, revision, expiry and transaction checks. Actions are `person`, `timeline`, `containment`, `phase`, `submit` and `finish`. Each choice is persisted in `decisions.station04`. Timeline entries must come from the participant's Station 03 selection, cannot repeat, and may be empty. No missing evidence is inserted automatically.

Submission is immutable/idempotent and changes the existing mission to `complete`. The result remains on Device 4 until Finish Mission; that action uses the existing six-second RESETTING/release flow. A completed mission is not expired while its result is being read. Closing a result device still allows its normal lease to expire; completed missions are retained but never requeued as active cases.

## Internal scoring

One backend projection evaluates the recorded decisions. The final total replaces `mission.hiddenScore`; raw legacy action deltas are never added to it. `record.result` stores the same final total and breakdown for recovery/reveal. No score is rendered during gameplay.

- Station 01 (200): sender/details/link verification and classification-appropriate final decisions, with a proportional risky-link deduction. No-link scenarios can earn the same maximum.
- Station 02 (250): quality of decisions over six objects. Unhandled items receive no automatic points. The existing three-decision minimum is unchanged; inspection alone earns nothing.
- Station 03 (300): four core clues, contextual directory and cross-source collection. Missing clues reduce earned credit; distractors have a moderate capped deduction.
- Station 04 (250): person 80, reconstruction 90, containment 80. Partial ordered reconstructions earn proportional credit. Additional sensible safe containment is neutral; deleting traces and reopening material reduce containment credit.

All components are clamped and rounded. A perfect run totals 1000. Outcomes combine score, containment and attribution; no harsh failure label is used. The final screen reveals the connected person/device, sequence, selected person, useful collected/missed items, distractors and containment comparison.

## Localization and validation

Stable IDs are language independent. New narrative and person labels have Arabic/English display values; the existing `mission.language` provider controls rendering. Station 02 artwork/hotspots and Station 03 light desktop/window manager are retained. Station 04 has a separate responsive case board and internal scrolling for detailed evidence/results.

`npm test` includes `backend/scripts/validateCases.mjs`: balanced selection, immutable snapshots, four solutions, physical/digital correlations, conditional records, score bounds, selected-only timelines, ownership, restart, lease recovery, A/B isolation, final persistence and reset. Browser checks use isolated stores and cover Arabic/English gameplay at 1920x1080, 1366x768, 1180x820 and 1024x768. Actual tablet touches, network interruptions and booth throughput require physical-device testing.
