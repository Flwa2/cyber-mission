# Game Flow

## Welcome

The participant sees the supplied cinematic artwork with a static 08:00 mission-duration HUD, a live Start Mission button, and an icon-only fullscreen control. The artwork supplies the title and environmental text; no large station cards or duplicate titles cover it.

Home does not create a Mission Session or start a countdown. The experience uses four physical devices, one per station. Cross-device backend synchronization remains pending.

When they select **Start Mission**, the app:

1. Generates a Mission ID.
2. Creates a Mission Session.
3. Stores `startedAt`.
4. Starts the global timer.
5. Sets `currentStation` to `1`.
6. Shows Station 01.

## Station 01: Suspicious Message

Current status: implemented.

- Render a dynamic simulated SMS interface.
- Select a randomized scenario per participant.
- Keep scenario classification hidden.
- Record decisions such as inspecting the sender, opening a link, reporting phishing, or reporting a legitimate message.
- Update Mission Session flags for later branching.
- Show only the current station identity during gameplay.
- Avoid showing the full four-station journey inside the station workspace.

When Station 01 completes, the participant sees a neutral handoff:

- Station 01 complete
- Decision recorded
- Proceed to Station 02, The Desk
- Mission ID
- Current mission time

The handoff does not reveal correctness, score, scenario classification, pass/fail state, or attack state.

## Station 02: The Desk

Current status: placeholder only.

Future station behavior:

- Present a physical workspace security challenge.
- Record actions involving desk security, unknown USB devices, and physical threat handling.
- Update hidden state and evidence.

## Station 03: Digital Investigation

Current status: placeholder only.

Future station behavior:

- Show investigation evidence based on previous flags.
- If `accountExposurePossible` is true, include simulated suspicious account activity.
- If false, show a different evidence path.
- Allow evidence collection without revealing outcome.

## Station 04: Connect the Evidence

Current status: placeholder only.

Future station behavior:

- Ask the participant to connect incident evidence.
- Record final incident response decisions.
- Prepare the Mission Session for final assessment.

## Final Assessment

Current status: placeholder only.

Future assessment may show:

- Attack contained or system compromised
- Pass or failed
- Cyber Score
- Incident timeline
- Important decisions
- Evidence collected
- Completion time

This screen should be built after all station logic exists.
