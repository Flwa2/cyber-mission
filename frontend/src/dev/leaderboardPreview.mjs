// Local visual fixtures only. Loaded behind import.meta.env.DEV; never persisted.
export function previewEntries(state) {
  if (state === 'empty') return [];
  return [
    ['نورة', 4850, 4],
    ['Sara', 4100, 4],
    ['خالد', 3200, 3],
    ['Omar', 1750, 2],
    ['ريم', 850, 1],
    ['Faisal', 0, 0],
  ].map(([playerName, score, completedStations], index) => ({
    missionId: `PREVIEW-${index + 1}`,
    playerName,
    avatarId: `cyber-${String(index + 1).padStart(2, '0')}`,
    rank: index + 1,
    score,
    completedStations,
  }));
}
