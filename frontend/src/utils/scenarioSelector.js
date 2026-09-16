export function getStation03Scenario(mission) {
  if (mission.flags.accountExposurePossible) {
    return "account-exposure-path";
  }

  return "standard-investigation-path";
}
