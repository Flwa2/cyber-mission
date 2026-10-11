import { DESK_OBJECTS } from '../../shared/deskObjects.mjs';

// Hidden observations for later stations. No correctness feedback is returned to the desk UI.
const consequences = {
  'usb:connect': ['unknownUsbConnected','External USB device connected'],
  'usb:report': ['physicalThreatContained','USB drive handed to IT'],
  'badge:use': ['accessBadgeUsed','Employee access badge used'],
  'badge:report': ['accessBadgeSecured','Access badge handed to security'],
  'badge:leave': ['physicalAccessExposure','Access badge left on desk'],
  'documents:read': ['confidentialDocumentsRead','Confidential documents read further'],
  'documents:secure': ['documentsSecured','Confidential documents secured'],
  'documents:report': ['documentExposureReported','Document exposure reported'],
  'documents:leave': ['confidentialInformationExposed','Confidential documents left exposed'],
  'cable:connect': ['unknownPeripheralConnected','Desk peripheral connected'],
  'cable:report': ['peripheralReported','Desk peripheral reported'],
  'qr:scan': ['deskQrScanned','Desk QR code scanned in simulation'],
  'qr:report': ['deskQrReported','Desk QR card reported'],
  'power:use': ['deskPowerBankUsed','Desk power bank used'],
  'power:report': ['deskPowerBankReported','Power bank handed to workplace support']
};
export function recordDeskDecision(mission, objectId, actionId, now) {
  const item=DESK_OBJECTS.find(item=>item.id===objectId);
  if(!item?.actions.some(([id])=>id===actionId))throw new Error('Unknown desk action');
  const station=mission.decisions.station02 || {items:{},startedAt:now,completedAt:null};
  if(station.items[objectId])return false;
  station.items[objectId]={objectId,actionId,recordedAt:now};
  mission.decisions.station02=station;
  const [flag,event]=consequences[`${objectId}:${actionId}`] || [null,`${item.name}: ${item.actions.find(([id])=>id===actionId)[1]}`];
  if(flag)mission.flags={...mission.flags,[flag]:true};
  const evidence={id:`desk:${objectId}`,station:2,objectId,actionId,recordedAt:now,event};
  // Current missions use an array; retain any older object-shaped evidence without flattening it.
  if(Array.isArray(mission.evidence))mission.evidence.push(evidence);
  else mission.evidence={...mission.evidence,station02:[...(mission.evidence?.station02||[]),evidence]};
  mission.updatedAt=now;
  return true;
}

