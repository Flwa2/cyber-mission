// Both conditions are required: production always uses the real countdown.
export const DEV_PAUSE_MISSION_TIMER =
  import.meta.env.DEV && import.meta.env.VITE_DEV_PAUSE_MISSION_TIMER === "true";
