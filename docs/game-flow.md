# Game Flow

## Welcome

The participant sees the mission title, time limit, station count, and ready status.

When they select **Start Mission**, the app:

1. Generates a Mission ID.
2. Creates a Mission Session.
3. Stores `startedAt`.
4. Starts the global timer.
5. Sets `currentStation` to `1`.
6. Shows Station 01.

## Station 01: Suspicious Message

Current status: placeholder only.

Future station behavior:

- Render a dynamic simulated SMS interface.
- Select a scenario per participant.
- Keep scenario classification hidden.
- Record decisions such as inspecting the sender, opening a link, reporting phishing, or reporting a legitimate message.
- Update Mission Session flags for later branching.

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
