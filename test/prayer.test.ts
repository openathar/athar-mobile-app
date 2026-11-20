import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PRAYER_ORDER, formatCountdown, getNextPrayer, getTodayTimes } from '@/hooks/use-prayer';

const BERLIN = { lat: 52.52, lng: 13.405 };

test('the six times of a day come in order', () => {
  const times = getTodayTimes(new Date('2026-11-20T12:00:00+01:00'), BERLIN.lat, BERLIN.lng);
  const list = PRAYER_ORDER.map((k) => times[k]);
  for (let i = 1; i < list.length; i++) assert.ok(list[i] > list[i - 1], `${PRAYER_ORDER[i]} after ${PRAYER_ORDER[i - 1]}`);
});

test('next prayer: the first time still ahead, after Isha tomorrow’s Fajr', () => {
  const day = new Date('2026-11-20T12:00:00+01:00');
  const times = getTodayTimes(day, BERLIN.lat, BERLIN.lng);
  assert.equal(getNextPrayer(new Date(times.dhuhr - 1000), times).key, 'dhuhr');
  assert.equal(getNextPrayer(new Date(times.dhuhr + 1000), times).key, 'asr');
  const late = getNextPrayer(new Date(times.isha + 1000), times);
  assert.equal(late.key, 'fajr');
  assert.ok(late.at > times.isha);
});

test('countdown is zero-padded hh:mm:ss', () => {
  assert.equal(formatCountdown(0), '00:00:00');
  assert.equal(formatCountdown((1 * 3600 + 2 * 60 + 3) * 1000), '01:02:03');
});
