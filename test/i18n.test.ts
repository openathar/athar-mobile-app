import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as i18n from '@/lib/i18n';

const snapshot = (l: i18n.Locale) => {
  i18n.applyLocale(l);
  return i18n.t as Record<string, unknown>;
};

test('every language has every string of the English dictionary', () => {
  const en = snapshot('en');
  for (const l of i18n.LOCALES) {
    const d = snapshot(l);
    assert.deepEqual(Object.keys(d).sort(), Object.keys(en).sort(), l);
    for (const [k, v] of Object.entries(d)) assert.equal(typeof v, typeof en[k], `${l}.${k}`);
  }
  i18n.applyLocale('en');
});

test('no string is left empty (the Arabic UI shows the phrase itself, not a meaning)', () => {
  const allowedEmpty = new Set(['ar.phSubhan', 'ar.phHamd', 'ar.phAkbar']);
  for (const l of i18n.LOCALES) {
    for (const [k, v] of Object.entries(snapshot(l))) {
      if (typeof v === 'string' && v.trim() === '') assert.ok(allowedEmpty.has(`${l}.${k}`), `${l}.${k} is empty`);
    }
  }
  i18n.applyLocale('en');
});

test('Arabic is right-to-left, the others are not', () => {
  for (const l of i18n.LOCALES) {
    i18n.applyLocale(l);
    assert.equal(i18n.IS_RTL, l === 'ar', l);
  }
  i18n.applyLocale('en');
});
