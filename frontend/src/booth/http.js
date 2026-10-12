// Resilient JSON transport for flaky venue Wi-Fi and Render restarts. Pure ES module (no DOM
// dependency except an optional localStorage language lookup) so Node tests can exercise it.
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MESSAGES = {
  en: { connection: 'Connection unstable. Reconnecting…', timeout: 'The server is slow to respond. Retrying…', failed: 'Request failed. Please try again.' },
  ar: { connection: 'الاتصال غير مستقر. جارٍ إعادة الاتصال…', timeout: 'الخادم بطيء في الاستجابة. جارٍ إعادة المحاولة…', failed: 'تعذر تنفيذ الطلب. حاول مرة أخرى.' }
};

export class RequestError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', transient = false, conflict, retryAfterMs } = {}) {
    super(message);
    this.name = 'RequestError';
    Object.assign(this, { status, code, transient, conflict, retryAfterMs });
  }
}

function language() {
  try {
    const mission = JSON.parse(globalThis.localStorage?.getItem('cyberMission.independentMission') || 'null');
    return mission?.language === 'ar' ? 'ar' : 'en';
  } catch { return 'en'; }
}
const text = key => MESSAGES[language()][key];
const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function attempt(url, init, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let status = 0, body, retryAfter = NaN;
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    status = response.status;
    body = await response.text(); // Same abort signal covers a stalled body.
    retryAfter = Number(response.headers?.get?.('retry-after'));
  } catch (error) {
    const timedOut = controller.signal.aborted;
    throw new RequestError(text(timedOut ? 'timeout' : 'connection'), { code: timedOut ? 'TIMEOUT' : 'NETWORK', transient: true });
  } finally { clearTimeout(timer); }
  let data;
  try { data = body ? JSON.parse(body) : undefined; } catch { data = undefined; }
  const ok = status >= 200 && status < 300;
  if (ok && data !== undefined) return data;
  // HTML from the Render proxy/captive portal, an empty or truncated body, or a 5xx.
  const transient = TRANSIENT_STATUS.has(status) || (ok && data === undefined);
  throw new RequestError(transient ? text('connection') : (typeof data?.error === 'string' ? data.error : text('failed')), {
    status, code: ok ? 'INVALID_RESPONSE' : 'HTTP_' + status, transient, conflict: data?.conflict,
    retryAfterMs: Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 5000) : undefined
  });
}

// retries are only used for requests the server treats idempotently (revision checks,
// request ids, replay detection); a retried request that already committed returns 409 with the
// committed mission instead of applying twice.
export async function requestJson(url, init = {}, { timeoutMs = 8000, retries = 0, deadlineMs = 20000, backoffMs = 400, fetchImpl = globalThis.fetch, sleep = defaultSleep, random = Math.random, now = Date.now } = {}) {
  const started = now();
  for (let tried = 0; ; tried++) {
    try { return await attempt(url, init, timeoutMs, fetchImpl); }
    catch (error) {
      if (!error.transient || tried >= retries) throw error;
      const delay = Math.min(error.retryAfterMs ?? backoffMs * 2 ** tried, 4000) * (0.5 + random() / 2);
      if (now() - started + delay + timeoutMs > deadlineMs) throw error;
      await sleep(delay);
    }
  }
}

// Poll loops: steady cadence, exponential backoff with jitter while the server is unreachable
// so a restarting instance is not hit by every device at once.
export function nextPollDelay(baseMs, failures, random = Math.random) {
  if (!failures) return baseMs;
  return Math.round(Math.min(baseMs * 2 ** Math.min(failures, 5), 8000) * (0.75 + random() / 2));
}
