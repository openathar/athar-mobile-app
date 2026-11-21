import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DUAS, DUAS_BY_PHASE, DUAS_SPECIAL } from '@/data/duas';
import { pickDuas } from '@/lib/dua-pick';

const ordinary = { month: 6, day: 10 };

test('every key the rules name exists in the data', () => {
  for (const keys of Object.values(DUAS_BY_PHASE)) for (const k of keys) assert.ok(DUAS[k], k);
  for (const r of DUAS_SPECIAL) assert.ok(DUAS[r.key], r.key);
});

test('an ordinary evening: the evening du’a, nothing special first', () => {
  assert.deepEqual(pickDuas({ phase: 'isha', hijri: ordinary, sincePrayer: 120 }), DUAS_BY_PHASE.isha);
});

test('right after a prayer, the du’a for finishing it comes first — not at sunrise', () => {
  assert.equal(pickDuas({ phase: 'dhuhr', hijri: ordinary, sincePrayer: 5 })[0], 'afterSalah');
  assert.notEqual(pickDuas({ phase: 'dhuhr', hijri: ordinary, sincePrayer: 45 })[0], 'afterSalah');
  assert.notEqual(pickDuas({ phase: 'sunrise', hijri: ordinary, sincePrayer: 5 })[0], 'afterSalah');
});

test('Ramadan: iftar at Maghrib, the pardon du’a first in the last ten nights', () => {
  assert.equal(pickDuas({ phase: 'maghrib', hijri: { month: 9, day: 12 }, sincePrayer: 60 })[0], 'iftar');
  const lastTen = pickDuas({ phase: 'isha', hijri: { month: 9, day: 25 }, sincePrayer: 90 });
  assert.equal(lastTen[0], 'afw');
  assert.equal(lastTen.filter((k) => k === 'afw').length, 1, 'no duplicates');
  assert.notEqual(pickDuas({ phase: 'isha', hijri: { month: 9, day: 5 }, sincePrayer: 90 })[0], 'afw');
  // Taught for Laylat al-Qadr: never an ordinary night's du'a.
  for (const phase of ['maghrib', 'isha'] as const) assert.ok(!pickDuas({ phase, hijri: ordinary, sincePrayer: 90 }).includes('afw'), phase);
});

test('the new crescent around the turn of the month, Arafah on 9 Dhu l-Hijja', () => {
  assert.equal(pickDuas({ phase: 'maghrib', hijri: { month: 3, day: 1 }, sincePrayer: 60 })[0], 'hilal');
  assert.equal(pickDuas({ phase: 'maghrib', hijri: { month: 3, day: 29 }, sincePrayer: 60 })[0], 'hilal');
  assert.ok(!pickDuas({ phase: 'dhuhr', hijri: { month: 3, day: 1 }, sincePrayer: 60 }).includes('hilal'));
  assert.equal(pickDuas({ phase: 'dhuhr', hijri: { month: 12, day: 9 }, sincePrayer: 60 })[0], 'arafah');
  assert.ok(!pickDuas({ phase: 'dhuhr', hijri: { month: 12, day: 10 }, sincePrayer: 60 }).includes('arafah'));
});
