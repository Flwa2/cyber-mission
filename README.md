# Cyber Mission

Cyber Mission is the foundation for a professional interactive cybersecurity awareness booth experience.

## Project Overview

**Experience:** Cyber Breach: 8 Minutes to Contain

The participant moves through four physical stations that all belong to one Mission Session. Decisions from earlier stations are stored in hidden mission state and can influence later scenarios.

This repository currently contains the first foundation phase only. It does not include full station gameplay, final assessment scoring, accounts, analytics, or production deployment.

## Experience Concept

Cyber Mission presents one connected cybersecurity incident across four stations:

1. Suspicious Message
2. The Desk
3. Digital Investigation
4. Connect the Evidence

Each participant receives a readable Mission ID such as `CM-A7K4P2`. Future versions can encode this ID in QR codes so participants can resume the same Mission Session on another booth device.

## Mission Flow

1. Participant opens the Welcome screen.
2. Participant selects **Start Mission**.
3. The app generates a Mission ID.
4. A Mission Session is created with `startedAt`.
5. The global 08:00 timer starts.
6. Station 01 receives the active Mission Session.
7. Future station decisions update hidden score, attack state, evidence, decisions, and flags.

## Architecture

The app is split into a Vite React frontend and a minimal Express backend.

The frontend currently owns the working prototype session through `localStorage`, isolated behind `storageService` and `missionService`. Station components should call mission services instead of reading or writing browser storage directly.

The backend exposes conceptual API routes for future multi-device station handoff:

- `POST /api/missions`
- `GET /api/missions/:missionId`
- `PATCH /api/missions/:missionId`

Backend mission storage is currently in-memory and resets when the backend restarts.

## Technology Stack

- React
- Vite
- JavaScript
- Node.js
- Express
- CSS custom properties

No authentication, cloud infrastructure, Docker, or database is included in this phase.

## Folder Structure

```text
cyber-mission/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── server.js
├── docs/
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   ├── images/
│   │   └── sounds/
│   └── src/
│       ├── components/
│       ├── config/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       ├── stations/
│       ├── styles/
│       └── utils/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

## Development Commands

Run frontend and backend together:

```bash
npm run dev
```

Run only the frontend:

```bash
npm run dev:frontend
```

Run only the backend:

```bash
npm run dev:backend
```

Build the frontend:

```bash
npm run build
```

Start the backend without watch mode:

```bash
npm run start:backend
```

## Frontend Setup

The frontend runs with Vite. By default it starts at:

```text
http://localhost:5173
```

The initial functional flow is:

1. Open the Welcome screen.
2. Select **Start Mission**.
3. Confirm Station 01 displays a Mission ID and a running timer.
4. Refresh the browser and confirm the mission remains active and the timer continues from `startedAt`.

## Backend Setup

The backend runs on:

```text
http://localhost:4000
```

Health check:

```text
GET http://localhost:4000/api/health
```

Mission API routes exist as a foundation for future station handoff. They are not wired into the frontend flow yet.

## Environment Configuration

Copy `.env.example` when environment variables are needed:

```bash
cp .env.example .env
```

Current values:

```text
VITE_API_BASE_URL=http://localhost:4000/api
PORT=4000
```

## Current Development Status

Implemented:

- GitHub-ready project structure
- React/Vite frontend
- Express backend foundation
- Central Mission Session model
- Readable Mission ID generator
- Global timer based on `startedAt`
- localStorage persistence behind services
- Hidden scoring engine foundation
- Branching scenario selector foundation
- Welcome screen
- Station 01 placeholder with active mission data
- Station 02 to Station 04 placeholders
- Documentation for architecture, flow, and next phases

Not implemented yet:

- Station 01 SMS gameplay
- Station 02 gameplay
- Station 03 gameplay
- Station 04 gameplay
- Final result screen
- Production persistence
- QR handoff
- Admin tools
- Analytics

## Security and Safety Notes

Cyber Mission is a fictional cybersecurity simulation. It must not collect real credentials, employee passwords, employee IDs, personal data, production account details, or real security tokens.

The app must not send real phishing messages, execute malware, encrypt files, scan corporate networks, modify employee files, disable security controls, or use malicious USB payloads.

## Future Stations

The next planned implementation prompt is:

```text
Build Station 01: Suspicious Message.
```

Station 01 should use dynamic React components for simulated SMS scenarios. Scenario classification must remain hidden from participants.
