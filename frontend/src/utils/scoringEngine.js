import { ACTION_RULES } from "../config/scoringConfig.js";

export function applyAction(mission, actionName, payload = {}) {
  const rule = ACTION_RULES[actionName];

  if (!rule) {
    return mission;
  }

  const nextFlags = {
    ...mission.flags,
    ...(rule.flags || {}),
    ...(payload.flags || {})
  };

  const hiddenScore = mission.hiddenScore + (rule.scoreDelta || 0);
  const hiddenAttackState = Math.max(0, mission.hiddenAttackState + (rule.attackStateDelta || 0));

  return {
    ...mission,
    hiddenScore,
    hiddenAttackState,
    flags: nextFlags,
    decisions: {
      ...mission.decisions,
      [actionName]: {
        station: mission.currentStation,
        recordedAt: new Date().toISOString(),
        payload
      }
    },
    updatedAt: new Date().toISOString()
  };
}
