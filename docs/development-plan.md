# Development Plan

## Phase 1: Project Foundation

Status: implemented.

- Initialize repository structure.
- Add React/Vite frontend.
- Add Express backend.
- Add Mission Session model.
- Add Mission ID generation.
- Add global timer from `startedAt`.
- Add localStorage persistence behind services.
- Add hidden scoring and branching architecture.
- Add Welcome screen.
- Add Station 01 handoff placeholder.
- Add station placeholders.
- Add documentation.

## Phase 2: Station 01, Suspicious Message

- Build dynamic SMS interface as React components.
- Add scenario data for phishing and legitimate messages.
- Randomly select scenarios.
- Keep scenario classification hidden.
- Add neutral decision recording.
- Update mission flags through the scoring engine.
- Verify Station 03 branching flags.

## Phase 3: Station 02, The Desk

- Build desk interaction model.
- Add physical security choices.
- Record unknown USB and physical threat decisions.
- Add hidden scoring rules.

## Phase 4: Station 03, Digital Investigation

- Build evidence investigation interface.
- Branch scenario content based on prior Mission Session flags.
- Track collected and missed evidence.

## Phase 5: Station 04, Connect the Evidence

- Build evidence connection interaction.
- Record final response actions.
- Mark mission complete.

## Phase 6: Final Assessment

- Build final result screen.
- Reveal outcome only after Station 04.
- Show score, timeline, decisions, evidence, and completion time.

## Phase 7: Multi-Device Booth Readiness

- Replace or extend localStorage persistence with backend API calls.
- Add durable database persistence.
- Add Mission ID lookup.
- Add QR handoff.
- Add kiosk deployment guidance.

## Phase 8: Production Hardening

- Add monitoring and operational logging.
- Add deployment pipeline.
- Review privacy and security safeguards.
- Conduct usability testing on target booth screens.
