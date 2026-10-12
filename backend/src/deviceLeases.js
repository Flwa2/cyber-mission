export const LEASE_TIMEOUT_MS = 15000;

export function releaseDevice(device) {
  Object.assign(device, { state: 'IDLE', deviceId: null, missionId: null });
  delete device.resetAt;
  delete device.lastHeartbeatAt;
}

export function renewLease(device, now = Date.now()) {
  device.lastHeartbeatAt = now;
}

// Cheap read-only check so idle polling never opens a store transaction.
export function needsSweep(state, now = Date.now()) {
  for (const device of Object.values(state.stations || {})) {
    if (!device.deviceId) continue;
    if (device.state === 'RESETTING' && now >= device.resetAt) return true;
    if (!Number.isFinite(device.lastHeartbeatAt) || now - device.lastHeartbeatAt > LEASE_TIMEOUT_MS) return true;
  }
  return false;
}

// Runs within the existing single-writer transaction. Never changes mission data.
export function sweepDeviceLeases(state, now = Date.now()) {
  for (const device of Object.values(state.stations)) {
    if (!device.deviceId) continue;
    if (device.state === 'RESETTING' && now >= device.resetAt) {
      releaseDevice(device);
      continue;
    }
    // One grace window for assignments written before leases were introduced.
    if (!Number.isFinite(device.lastHeartbeatAt)) {
      renewLease(device, now);
      continue;
    }
    if (now - device.lastHeartbeatAt <= LEASE_TIMEOUT_MS) continue;
    const record = state.missions[device.missionId];
    if (record?.stage === device.station && ['ACTIVE', 'CLAIMING'].includes(record.phase)) {
      record.phase = 'QUEUED';
      record.leaseRecoveredAt = new Date(now).toISOString();
      delete record.claimedBy;
      delete record.incomingUntil;
      // Station 1 has no incoming queue sequence until a device is lost.
      if (record.order == null) record.order = ++state.sequence;
    }
    releaseDevice(device);
  }
}
