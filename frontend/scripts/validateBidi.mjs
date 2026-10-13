import assert from 'node:assert/strict';
import {bidiSegments} from '../src/utils/bidi.mjs';

const ltr=text=>bidiSegments(text).filter(p=>p.ltr).map(p=>p.text);
const rejoin=text=>bidiSegments(text).map(p=>p.text).join('');
const samples=[
 'راجعت السجل. نُزّلت حزمة Account_Update.zip من benefits-review.example.net ثم أُضيفت قاعدة إلى archive@review-mail.example.net.',
 'ملف المزايا HR-18 (طلب رقم 1048) على الجهاز WS-27، المبلغ SAR 4,860 · 14:00–15:30',
 'مرجع المراجعة: 482915',
 'لا يوجد نص إنجليزي هنا.'
];
for(const s of samples)assert.equal(rejoin(s),s,'segments rebuild the exact text');
assert.deepEqual(ltr(samples[0]),['Account_Update.zip','benefits-review.example.net','archive@review-mail.example.net']);
assert.deepEqual(ltr(samples[1]),['HR-18','1048','WS-27','SAR 4,860','14:00–15:30']);
assert.deepEqual(ltr(samples[2]),['482915']);
assert.deepEqual(ltr(samples[3]),[]);
assert.deepEqual(bidiSegments(undefined),[]);
console.log('Bidi PASS: emails, domains, filenames, codes, currency, times and numbers are isolated; Arabic text is untouched.');
