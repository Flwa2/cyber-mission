const params=new URLSearchParams(globalThis.location?.search||'');
export const INDEPENDENT_MODE=Boolean(globalThis.location)&&!params.has('deviceStation')&&params.get('mode')!=='station';
