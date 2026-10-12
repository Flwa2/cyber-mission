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

// On slow or interrupted Wi-Fi a failed image gets up to two delayed retries.
window.addEventListener('error',event=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement)||!img.src)return;
  const tries=Number(img.dataset.retry||0);
  if(tries>=2)return;
  img.dataset.retry=String(tries+1);
  const source=img.src;
  setTimeout(()=>{img.src='';img.src=source;},1500*(tries+1));
},true);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>{isLeaderboard?<LiveLeaderboard/>:<App/>}</React.Suspense>
    <CreatorCredit/>
  </React.StrictMode>
);
