# Station 03: Digital Investigation

The physical station at `/?deviceStation=3` consumes the existing booth session. The supplied wallpaper is stored unchanged in `frontend/public/assets/station03-workstation.png`; all controls, windows and records are React UI.

## Content and earlier decisions

`shared/station03Content.mjs` builds a deterministic bilingual catalog from the mission. Baseline records predate mission start: mail, access history, a session export and a deleted export share AUTH-204/WS-27 identifiers. Ordinary meeting, maintenance, document and device records provide context and distractors. A protected payroll document is unavailable; it has no password interaction.

- Station 01: `decisions.station01.linkOpened`, `flags.suspiciousLinkOpened` and the recorded destination together produce navigation records. The action timestamp is used when available. Opening a link does not imply credential submission, a downloaded payload or execution.
- Station 02: `items.usb.actionId === 'connect'` produces a USB connection record; `items.cable.actionId === 'connect'` produces a peripheral record, using their recorded timestamps. Other object decisions do not fabricate digital consequences.

## Persistence and handoff

The investigation endpoint validates device ownership, active station, expiry and revision using the existing booth transaction. `decisions.station03` stores inspected IDs, selected IDs and start/completion timestamps. Evidence records carry stable ID, source, type, timestamp, relation and internal relevance metadata. Existing evidence is retained, including legacy object-shaped evidence. The participant UI omits internal relevance/decision metadata and accepts distractors without feedback.

Completion has no correct-evidence count or new minimum. It marks Station 03 complete, queues Station 04 and uses the existing six-second terminal reset. Original mission ID, startedAt, previous decisions and scoring remain unchanged. Station 04 gameplay is not implemented.

## Validation

`npm test` includes `backend/scripts/validateInvestigation.mjs`: conditional content, collect/remove, distractors, hidden fields, ownership/revision checks, restart persistence, lease recovery, FIFO, language isolation, completion and Station 04 handoff.

Browser checks use isolated JSON stores, not the live booth. Arabic and English desktop/windows are checked at 1920x1080, 1366x768, 1180x820 and 1024x768, including refresh, collection, removal and participant turnover. Real tablet touch, fullscreen restrictions and physical network interruptions still require booth-device testing.
