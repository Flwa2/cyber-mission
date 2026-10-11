import { useEffect } from 'react';
import { stationRequest } from './boothApi.js';

export const HEARTBEAT_INTERVAL_MS = 3000;

export default function useDeviceHeartbeat(missionId) {
  useEffect(() => {
    if (!missionId) return;
    let stopped = false;
    const beat = async () => {
      if (stopped) return;
      // Poll/sync owns connection error presentation and recovery. A heartbeat
      // cannot acquire a lease or change mission data.
      try { await stationRequest('heartbeat', { missionId }); } catch {}
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => { stopped = true; clearInterval(timer); };
  }, [missionId]);
}
