// Presentation ordering only: scores remain backend-authoritative.
// A locale-independent ID tie-breaker cannot drift with progress, polling order,
// language switches, refreshes, or the time an equal score was received.
export function reconcileEntries(previous, incoming) {
  const byId = new Map(previous.map(entry => [entry.missionId, entry]));
  const fields = ['missionId', 'playerName', 'avatarId', 'score', 'completedStations'];
  const next = incoming.map(entry => {
    const old = byId.get(entry.missionId);
    return old && fields.every(field => old[field] === entry[field]) ? old : entry;
  }).sort((a, b) => b.score - a.score || (a.missionId < b.missionId ? -1 : a.missionId > b.missionId ? 1 : 0));
  return next.length === previous.length && next.every((entry, index) => entry === previous[index]) ? previous : next;
}
