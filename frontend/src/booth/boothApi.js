import {requestJson} from './http.js';
import {INDEPENDENT_MODE} from './playMode.js';
import {independentRequest} from './independentApi.js';
export const stationNumber = Math.min(4, Math.max(1, Number(new URLSearchParams(location.search).get('deviceStation')) || 1));
const key = `cyberMission.device.${stationNumber}`;
// Re-read the shared credential for each request. Web Locks serialize first-use
// initialization across tabs; existing identities are never replaced.
export let deviceId = localStorage.getItem(key);
export async function getDeviceId() {
 const resolve = () => {
  deviceId = localStorage.getItem(key);
  if (!deviceId) {
   deviceId = Array.from(crypto.getRandomValues(new Uint8Array(16)), n=>n.toString(16).padStart(2,'0')).join('');
   localStorage.setItem(key, deviceId);
  }
  return deviceId;
 };
 if (navigator.locks) return navigator.locks.request(key, resolve);
 resolve();
 // Guest-LAN HTTP has no Web Locks; settle concurrent initialization writes
 // before sending a credential, then always use the shared persisted value.
 await new Promise(done=>setTimeout(done,0));
 return deviceId = localStorage.getItem(key);
}
export async function boothRequest(path, body) {
 return requestJson("/api/booth"+path, {method:body ? 'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}, body ? {timeoutMs:8000,retries:path.endsWith('/heartbeat')||path.endsWith('/poll')?0:2,deadlineMs:26000} : {timeoutMs:6000,retries:1});
}
export const stationRequest=async(action,body={})=>INDEPENDENT_MODE?independentRequest(action,body):boothRequest(`/stations/${stationNumber}/${action}`,{deviceId:await getDeviceId(),...body});
