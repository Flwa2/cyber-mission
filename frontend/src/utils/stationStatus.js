export const STATION_STATUS = {
  LOCKED: "LOCKED",
  WAITING: "WAITING",
  READY: "READY",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED"
};

export const STATIONS = [
  { number: 1, name: "Suspicious Message" },
  { number: 2, name: "The Desk" },
  { number: 3, name: "Digital Investigation" },
  { number: 4, name: "Connect the Evidence" }
];

export function getStationStatus(mission, stationNumber) {
  if (!mission) return STATION_STATUS.LOCKED;

  if (mission.completedStations?.includes(stationNumber)) {
    return STATION_STATUS.COMPLETED;
  }

  if (mission.currentStation === stationNumber) {
    return STATION_STATUS.ACTIVE;
  }

  const previousStation = stationNumber - 1;

  if (stationNumber > mission.currentStation && mission.completedStations?.includes(previousStation)) {
    return STATION_STATUS.READY;
  }

  if (stationNumber > mission.currentStation) {
    return STATION_STATUS.WAITING;
  }

  return STATION_STATUS.LOCKED;
}

export function getStationStatuses(mission) {
  return STATIONS.map((station) => ({
    ...station,
    status: getStationStatus(mission, station.number)
  }));
}
