# Arabic / English booth localization

The participant journey supports `ar` and `en`. Arabic is the default. Home lets the participant select the language before mission preparation. The mission's language takes precedence over local presentation preferences.

## Architecture and persistence

- `shared/language.mjs` normalizes language and defines the Arabic default.
- `frontend/src/locales/LanguageProvider.jsx` supplies translations and updates document language/direction.
- `ar.js`, `en.js`, `scenarios.ar.js`, and `translate.js` hold presentation dictionaries and interpolate randomized scenario values. Localization does not replace the stored fictional scenario or its decision identifiers.
- `LanguageSelector.jsx` provides the Home dropdown. `language.css` contains RTL adaptations while retaining physical phone/desk placement and isolating URLs, IDs, and numeric counters.
- `missionService.js` puts `language` on the prepared Mission Session. MissionContext and App pass the selection into preparation.
- The live booth route stores this field in the existing JSON mission snapshot. An existing mission cannot change language through synchronization. Missing legacy language is interpreted as Arabic and normalized on the next sync.
- StationDevice derives language from its assigned mission; without a mission it returns to Arabic. Recovery, refresh, and handoff retain the same session metadata.

## Localization file inventory

New localization files:

- `shared/language.mjs`
- `frontend/src/locales/{LanguageProvider.jsx,LanguageSelector.jsx,ar.js,en.js,scenarios.ar.js,translate.js,language.css}`
- `frontend/public/assets/cyber-mission-home-ar.png`
- `frontend/scripts/validateLocalization.mjs`
- `docs/localization.md`

Existing files updated for localization (some already contained unrelated uncommitted work):

- `frontend/src/App.jsx`, `context/MissionContext.jsx`, `services/missionService.js`
- `frontend/src/pages/Welcome/Welcome.jsx`, `pages/MissionBriefing/MissionBriefing.jsx`
- Components: `ExitMissionDialog`, `FullscreenButton`, `LoadingScreen`, `MissionDialog`, `MissionTimer`, `MissionTopBar`, `StationWaitingScreen`, `StationCompletion` JSX files
- `frontend/src/booth/StationDevice.jsx`, `StationOneSync.jsx`
- Station01: `ActionMenu.jsx`, `IncomingNotification.jsx`, `LinkInspector.jsx`, `MessageDetails.jsx`, `PhoneInterface.jsx`, `ReportConfirm.jsx`, `SenderInspector.jsx`, `SimulatedBrowser.jsx`, `Station01.jsx`
- `frontend/src/stations/Station02/Station02.jsx`
- `backend/src/routes/booth.js`
- `backend/scripts/validateBooth.mjs`, `validateLeases.mjs`
- Root `package.json` test command

## Validation

- Full npm test suite passed, including booth FIFO, synchronization, lease/recovery, persistence, and language metadata checks. It was not repeated after final presentation-only changes.
- Final localization data validation passed: 12 scenarios, all message variants, sender/context data, eight simulated previews, and six desk objects/actions. IDs, action keys, classification, URLs, and hotspot coordinates remain unchanged.
- Isolated two-device browser run passed: Arabic A to Station 02; English B queued behind A; Arabic recovery after lease expiry with an identical mission snapshot; B automatically displayed in English; English refresh retained original startedAt; final idle returned to Arabic.
- All 12 scenarios in both languages were checked at 1920x1080, 1366x768, 1180x820, and 1024x768, including inspectors, actions, simulated links, page overflow, and message clipping.
- Final targeted Arabic/English completion and Exit dialog checks passed. Exit remains a native modal top layer. No page runtime errors occurred in the browser runs.
- Final production build passed.

English Home asset verified blob: `2f805f949187aa5c321714981d73d4d804b9d5ac`.
Arabic asset SHA-256 matches the supplied source: `89CAF8AB64901149D752C4087F6ED5DF339A800483DBB779151C03986051A68F`.

## Boundaries and remaining validation

No known untranslated participant UI remains in the implemented Home/briefing/Station 01/Station 02 journey. Brand artwork, text baked into the desk image, technical acronyms, IDs, and URLs intentionally retain their original form. Developer-only recovery tools and future gameplay placeholders are outside this localization pass.

Responsive browser checks used Chromium; physical iPad Safari still needs an on-device acceptance check. Browser test data used an isolated store and did not reset the live booth.

FIFO, heartbeat interval, lease duration, timer semantics, scoring, evidence, decision keys, hotspot placement, and completion timing were not changed by localization. Earlier unrelated working-tree changes were preserved. No commit or push was made.
