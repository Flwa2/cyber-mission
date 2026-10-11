// Both conditions are required: production always uses the real countdown.
export const DEV_STATION04_PREVIEW = import.meta.env.DEV &&
  new URLSearchParams(location.search).get('deviceStation') === '4' &&
  new URLSearchParams(location.search).get('devPreview') === 'station04';

export const DEV_STATION03_PREVIEW = import.meta.env.DEV &&
  new URLSearchParams(location.search).get('deviceStation') === '3' &&
  new URLSearchParams(location.search).get('devPreview') === 'station03';
