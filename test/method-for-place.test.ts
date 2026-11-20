import assert from 'node:assert/strict';
import { test } from 'node:test';

import { methodForPlace, methodForZone } from '@/lib/method-for-place';

test('a chosen city decides by its country', () => {
  assert.equal(methodForPlace({ lat: 21.42, lng: 39.83, country: 'SA' }), 'MAKKAH');
  assert.equal(methodForPlace({ lat: 30.04, lng: 31.24, country: 'eg' }), 'EGYPT');
  assert.equal(methodForPlace({ lat: 24.86, lng: 67.0, country: 'PK' }), 'KARACHI');
  assert.equal(methodForPlace({ lat: 35.69, lng: 51.39, country: 'IR' }), 'TEHRAN');
  assert.equal(methodForPlace({ lat: 40.71, lng: -74.0, country: 'US' }), 'ISNA');
  assert.equal(methodForPlace({ lat: 48.86, lng: 2.35, country: 'FR' }), 'FRANCE');
  assert.equal(methodForPlace({ lat: 55.76, lng: 37.62, country: 'RU' }), 'RUSSIA');
  assert.equal(methodForPlace({ lat: -6.2, lng: 106.85, country: 'ID' }), 'MALAYSIA');
  // Known countries without their own convention get the Muslim World League.
  assert.equal(methodForPlace({ lat: 52.52, lng: 13.4, country: 'DE' }), 'MWL');
  assert.equal(methodForPlace({ lat: 41.01, lng: 28.98, country: 'TR' }), 'MWL');
});

test('a GPS position without a country falls back to regions', () => {
  assert.equal(methodForPlace({ lat: 52.37, lng: 9.73 }), 'MWL'); // Hannover
  assert.equal(methodForPlace({ lat: 24.71, lng: 46.68 }), 'MAKKAH'); // Riyadh
  assert.equal(methodForPlace({ lat: 25.2, lng: 55.27 }), 'MAKKAH'); // Dubai
  assert.equal(methodForPlace({ lat: 30.04, lng: 31.24 }), 'EGYPT'); // Cairo
  assert.equal(methodForPlace({ lat: 33.51, lng: 36.29 }), 'EGYPT'); // Damascus
  assert.equal(methodForPlace({ lat: 33.31, lng: 44.36 }), 'EGYPT'); // Baghdad
  assert.equal(methodForPlace({ lat: 29.37, lng: 47.98 }), 'MAKKAH'); // Kuwait
  assert.equal(methodForPlace({ lat: 30.51, lng: 47.81 }), 'EGYPT'); // Basra
  assert.equal(methodForPlace({ lat: 35.69, lng: 51.39 }), 'TEHRAN'); // Tehran
  assert.equal(methodForPlace({ lat: 38.08, lng: 46.29 }), 'TEHRAN'); // Tabriz
  assert.equal(methodForPlace({ lat: 31.32, lng: 48.67 }), 'TEHRAN'); // Ahvaz
  assert.equal(methodForPlace({ lat: 24.86, lng: 67.0 }), 'KARACHI'); // Karachi
  assert.equal(methodForPlace({ lat: 23.81, lng: 90.41 }), 'KARACHI'); // Dhaka
  assert.equal(methodForPlace({ lat: 3.14, lng: 101.69 }), 'MALAYSIA'); // Kuala Lumpur
  assert.equal(methodForPlace({ lat: 1.29, lng: 103.85 }), 'SINGAPORE'); // Singapore
  assert.equal(methodForPlace({ lat: 43.65, lng: -79.38 }), 'ISNA'); // Toronto
  assert.equal(methodForPlace({ lat: 41.01, lng: 28.98 }), 'MWL'); // Istanbul
});

test('the time zone guess is only a fallback', () => {
  assert.equal(methodForZone('Asia/Riyadh'), 'MAKKAH');
  assert.equal(methodForZone('America/Chicago'), 'ISNA');
  assert.equal(methodForZone('Europe/Berlin'), 'MWL');
  assert.equal(methodForZone(undefined), 'MWL');
});
