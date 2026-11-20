import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Methods, PrayerTimes } from '@openathar/athan-core-ts';

import { currentWindow, formatSpan, type DayTimes } from '@/lib/prayer-window';

// Real times from the core: Berlin, 20 November 2026, Muslim World League.
const times: DayTimes = new PrayerTimes(Methods.MWL).getTimes(2026, 11, 20, 52.52, 13.405);
const MIN = 60_000;
const DAY = 86_400_000;

test('each obligatory prayer lasts until the next marker', () => {
  const fajr = currentWindow(times.fajr + 10 * MIN, times);
  assert.deepEqual(fajr, { kind: 'prayer', key: 'fajr', start: times.fajr, end: times.sunrise, endsAt: 'sunrise' });
  assert.equal((currentWindow(times.dhuhr + MIN, times) as { endsAt: string }).endsAt, 'asr');
  assert.equal((currentWindow(times.asr + MIN, times) as { endsAt: string }).endsAt, 'maghrib');
  assert.equal((currentWindow(times.maghrib + MIN, times) as { endsAt: string }).endsAt, 'isha');
});

test('the forenoon: a pause at sunrise, Duha, a pause before noon', () => {
  assert.equal(currentWindow(times.sunrise + 5 * MIN, times).kind, 'pause');
  const duha = currentWindow(times.duhaStart + MIN, times);
  assert.equal(duha.kind, 'duha');
  assert.equal(duha.end, times.duhaEnd);
  assert.equal(currentWindow(times.dhuhr - 5 * MIN, times).kind, 'pause');
});

test("Isha lasts until the core's midnight, then the night prayer begins", () => {
  const isha = currentWindow(times.isha + MIN, times);
  assert.equal(isha.kind, 'prayer');
  assert.ok(isha.end > times.isha, 'midnight comes after Isha');
  const night = currentWindow(isha.end + MIN, times);
  assert.equal(night.kind, 'night');
  assert.equal(night.end, times.fajr + DAY);
  // The last third lies between the middle of the night and Fajr.
  assert.ok(night.kind === 'night' && night.lastThird > night.start && night.lastThird < night.end);
});

test('before Fajr it is still the night that began yesterday', () => {
  const w = currentWindow(times.fajr - 30 * MIN, times);
  assert.equal(w.kind, 'night');
  assert.equal(w.end, times.fajr);
});

test('spans read as hours and minutes', () => {
  assert.equal(formatSpan(42 * MIN), '42 min');
  assert.equal(formatSpan((3 * 60 + 5) * MIN), '3 h 05 min');
});
