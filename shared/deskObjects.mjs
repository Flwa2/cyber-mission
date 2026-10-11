// Image-relative coordinates refer to the unmodified 1536 x 1024 desk artwork.
export const DESK_OBJECTS = [
  { id:'usb', name:'USB drive', x:52.5, y:44.3, details:[['Label','Project Files'],['Found','On the desk'],['Owner','Not identified']], actions:[['connect','Connect to computer'],['report','Report / Hand to IT'],['leave','Leave it']] },
  { id:'badge', name:'Access badge', x:54.1, y:79.5, details:[['Name','Daniel Carter'],['Department','Operations'],['Organization','Riverside']], actions:[['use','Use the badge'],['report','Hand to security'],['leave','Leave it']] },
  { id:'documents', name:'Confidential documents', x:33.8, y:58.8, details:[['Marking','Confidential'],['Handling','Internal Use Only'],['Found','Openly accessible on the desk']], actions:[['read','Read further'],['secure','Secure the documents'],['report','Report the exposure'],['leave','Leave them']] },
  { id:'cable', name:'Cable / peripheral', x:64.4, y:46.8, details:[['Appearance','Coiled black cable'],['Found','Beside the USB drive'],['Owner','Not identified']], actions:[['connect','Connect / Use it'],['report','Report it'],['leave','Leave it']] },
  { id:'qr', name:'Free Coffee card', x:54.3, y:58.5, details:[['Offer','Free Coffee'],['Printed on card','A QR code'],['Destination','Not shown in text']], actions:[['scan','Scan QR'],['report','Report it'],['leave','Leave it']] },
  { id:'power', name:'Power bank', x:68.8, y:67.4, details:[['Marking','Riverside'],['Appearance','Black portable power bank'],['Found','On the desk']], actions:[['use','Use to charge a device'],['report','Hand to workplace support'],['leave','Leave it']] }
];
export const MIN_DESK_DECISIONS = 3;
