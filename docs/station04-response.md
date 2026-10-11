# Station 04 narrative characters and development preview

## Mission assignment

New missions receive `mission.narrativeAssignment` in the existing first Station01
sync transaction, before Station02 can use it. The server assigns one of three
ordinary workplace incident accounts (document link, sharing request or unrequested
sign-in approval), one person from a 12-character fictional pool, two distinct
distractors, and a shuffled choice order. Assignment uses server cryptographic
randomness and is independent of earlier decisions or scoring.

The saved snapshot contains `version`, `assignedAt`, `scenarioId`,
`associatedPersonId` and `choices`. Each choice snapshots its stable ID, bilingual
first name and role, explicit presentation, avatar ID and portrait metadata.
Public responses expose the choices but remove the associated-person ID and
scenario ID. Client sync cannot replace the server-owned assignment, including
through revision-conflict recovery.

Characters: Sara, Nora, Reem, Lama, Huda, Dana, Omar, Fahad, Mohammed, Khalid, Ahmed
and Nawaf. Twelve original local SVG portraits are explicitly mapped to these
characters. Portraits have curated hair/scarf, skin, clothing and accessory
metadata; no gender inference or external image API is involved. Player Setup's
separate avatar system is unchanged.

## Cross-station clues

- Station02's confidential-document inspector reads its `Prepared by / إعداد`
  value from the saved associated person.
- Station03 uses an existing mail evidence ID (the previously authored Sara
  correspondence) for `Document access notification / إشعار الوصول إلى المستندات`.
  Sender name, account, signature and narrative all use the assigned character.
  The employee naturally describes opening an unverified document link and
  signing in, sharing before verifying the requester, or approving an unrequested
  sign-in, followed by an unexpected external sharing notification. They ask for
  assistance and mention the printed documents on the desk.
- Evidence IDs, timestamps, relevance, scoring and randomized classification /
  sharing challenges are preserved. Collected copies of the same mail artifact
  receive the same updated presentation while the investigation is active.
- Station04 displays exactly the saved three choices in the saved order. Scoring
  compares the submitted stable ID with the private associated-person ID, never
  with a name, card position, language or appearance. The existing private
  100/100/100 scoring and 300-point maximum remain unchanged.

## Existing missions

A missing assignment in a pre-feature mission is initialized once to the prior
Sara story and original Nora/Sara/Khalid order (`migration: legacy-fixed-sara`).
This deliberately preserves clues already seen and previously recorded answers.
Completed decisions and scores are never rewritten. Already saved assignments
are never rerolled. New missions receive randomized assignments.

Assignment is part of the existing JSON persistence and follows the existing
revision, queue, lease, handoff and recovery mechanisms. No database or global
scoring changes are introduced.

## Step 1 presentation

The heading, question, three equally sized cards and NEXT action form one aligned
foreground group. Arabic content remains RTL; the physical card order stays the
same in both languages. Only Step1 styles changed; Steps2/3, header, wallpaper and
other stations' designs are preserved.

## Isolated development preview

The actual Station04 component is rendered by a DEV-only state adapter:

`http://localhost:5173/?deviceStation=4&devPreview=station04&phase=person&lang=ar`

Use `lang=en` for English. Available phases: `intro`, `person`, `response`,
`evidence`, `complete`. Add `&seed=1`, `&seed=2`, etc. for reproducible different
assignments. A seed change creates a fresh preview; language changes preserve
assignment, order, portraits and the selected answer. Refresh restores the
current preview state from `sessionStorage` under
`cyberMission.devPreview.station04.v1`. Actions update the phase in the URL.
Opening a different phase seeds that phase with the same narrative assignment.

The preview calls the existing pure Station04 transition function locally. It
never calls the booth API, writes the real mission key, claims a device, enters
queues or produces a real result. The development timer remains at 08:00. Exit
confirmation resets only this temporary preview. Completion remains available
for visual inspection without the real six-second reset.

Without the explicit preview parameter the normal device flow is unchanged.
Production removes the preview import and fixture entirely and ignores preview,
phase and seed overrides.

## Validation

- `npm test`: existing frontend/backend suites plus narrative and preview checks.
- `npm run build`; `git diff --check`.
- 40 seeded missions: varied associated characters/combinations, all answer
  positions, distinct IDs/avatars, consistent clues and stable recovery/language.
- 10 independently created server missions: assignment before Station02,
  forged client assignment rejected/ignored, restart retention and FIFO handoff.
- Real Station01–04 integration tests retain the original mission, timer,
  evidence and decisions, including lease recovery and automatic completion.
- Browser: Arabic/English at 1920x1080, 1366x768, 1180x820 and 1024x768;
  selection, NEXT, refresh, unchanged physical card order and portraits.
- Production browser ignores the preview URL; preview fixture markers absent
  from production JavaScript; no preview API calls or real mission records.

The existing heartbeat-reset 409 behavior is outside this change and remains
untouched. No Live Board, final reveal, database migration or global scoring
implementation is included.

## Files changed for the narrative refinement

- `shared/narrativeCharacters.mjs`
- `shared/narrativeAssignment.mjs`
- `shared/station04Content.mjs`
- `backend/src/narrativeAssignment.js`
- `backend/src/caseEngine.js`
- `backend/src/station03Experience.js`
- `backend/src/station04Response.js`
- `backend/src/routes/booth.js`
- `frontend/src/stations/Station04/Station04.jsx`
- `frontend/src/stations/Station04/Station04.css`
- `frontend/src/dev/Station04DevPreview.jsx`
- `frontend/src/dev/station04Preview.mjs`
- `frontend/public/assets/narrative-avatars/narrative-{sara,nora,reem,lama,huda,dana,omar,fahad,mohammed,khalid,ahmed,nawaf}.svg` (12 files)
- `backend/scripts/validateNarrative.mjs`
- `backend/scripts/validateBooth.mjs`
- `backend/scripts/validateLeases.mjs`
- `backend/scripts/validateCases.mjs`
- `backend/scripts/validateStation04.mjs`
- `frontend/scripts/validateStation04Preview.mjs`
- `backend/package.json`
- `docs/station04-response.md`

The previously implemented preview entry in `App.jsx`, development-only config,
and frontend test registration remain in place. They were not redesigned by this
narrative refinement.
