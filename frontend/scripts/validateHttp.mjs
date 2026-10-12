import assert from 'node:assert/strict';
import { requestJson, nextPollDelay, RequestError } from '../src/booth/http.js';

const res = (status, body, headers = {}) => ({ status, headers: { get: k => headers[k.toLowerCase()] ?? null }, text: async () => body });
const fast = { sleep: async () => {}, random: () => 0.5 };
const seq = list => { let i = 0; const calls = []; const fn = async (url, init) => { calls.push(init); const next = list[Math.min(i++, list.length - 1)]; if (next instanceof Error) throw next; return next; }; fn.calls = calls; return fn; };

// HTML 502 never surfaces a JSON parse error and is retried
let f = seq([res(502, '<html>Bad Gateway</html>'), res(200, '{"ok":1}')]);
assert.deepEqual(await requestJson('/x', {}, { ...fast, retries: 2, fetchImpl: f }), { ok: 1 });
assert.equal(f.calls.length, 2);

// no retries configured: error is a friendly RequestError, not SyntaxError
f = seq([res(503, '<html>')]);
await assert.rejects(requestJson('/x', {}, { ...fast, fetchImpl: f }), e => e instanceof RequestError && e.transient && !/JSON|Unexpected/.test(e.message));

// 200 with an HTML/empty body is invalid and transient
f = seq([res(200, '<html>portal</html>'), res(200, '')]);
await assert.rejects(requestJson('/x', {}, { ...fast, retries: 1, fetchImpl: f }), e => e.code === 'INVALID_RESPONSE' && e.transient);
assert.equal(f.calls.length, 2);

// 409 conflict is delivered, never retried
f = seq([res(409, '{"error":"stale","conflict":{"mission":{"missionId":"M"}}}')]);
await assert.rejects(requestJson('/x', {}, { ...fast, retries: 3, fetchImpl: f }), e => e.status === 409 && e.conflict.mission.missionId === 'M' && !e.transient);
assert.equal(f.calls.length, 1);

// 4xx with server message keeps the message
f = seq([res(400, '{"error":"bad input"}')]);
await assert.rejects(requestJson('/x', {}, { ...fast, retries: 3, fetchImpl: f }), e => e.message === 'bad input');

// network failure retried then succeeds
f = seq([new TypeError('fetch failed'), res(201, '{"a":2}')]);
assert.deepEqual(await requestJson('/x', {}, { ...fast, retries: 1, fetchImpl: f }), { a: 2 });

// stalled request times out and aborts
const stalled = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
await assert.rejects(requestJson('/x', {}, { ...fast, timeoutMs: 30, fetchImpl: stalled }), e => e.code === 'TIMEOUT' && e.transient);

// deadline bounds total retry time
let t = 0;
f = seq([res(502, 'x')]);
await assert.rejects(requestJson('/x', {}, { sleep: async () => { t += 5000; }, random: () => 1, now: () => t, retries: 10, deadlineMs: 12000, timeoutMs: 6000, fetchImpl: f }));
assert.ok(f.calls.length <= 3);

// poll backoff is bounded and resets
assert.equal(nextPollDelay(1000, 0), 1000);
assert.ok(nextPollDelay(1000, 10, () => 1) <= 10000);
assert.ok(nextPollDelay(1000, 2, () => 0.5) > 1000);

console.log('Frontend HTTP resilience validation passed.');
