import React from "react";
import { createRoot } from "react-dom/client";
import CreatorCredit from './components/CreatorCredit/CreatorCredit.jsx';
const App=React.lazy(()=>import('./App.jsx'));
const LiveLeaderboard=React.lazy(()=>import('./pages/LiveLeaderboard/LiveLeaderboard.jsx'));
const isLeaderboard=new URLSearchParams(location.search).get('display')==='leaderboard';
import "./styles/variables.css";
import "./styles/global.css";
// Keep legacy Station01 base rules before the approved cinematic overrides, even when App is lazy-loaded.
import "./stations/Station01/Station01.css";
import "./styles/missionExperience.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>{isLeaderboard?<LiveLeaderboard/>:<App/>}</React.Suspense>
    <CreatorCredit/>
  </React.StrictMode>
);
