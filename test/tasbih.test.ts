import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PHRASES, ROUND, count, dayKey, initialState, parseState, position, todayCount } from '@/lib/tasbih';

const at = (iso: string) => new Date(iso);

test('a round is 33 + 33 + 34 = 100', () => {
  assert.deepEqual(PHRASES.map((p) => p.times), [33, 33, 34]);
  assert.equal(ROUND, 100);
});

test('position walks through the three phrases', () => {
  const cases: [number, string, number, number][] = [
    [0, 'subhan', 0, 0],
    [32, 'subhan', 32, 0],
    [33, 'hamd', 0, 0],
    [65, 'hamd', 32, 0],
    [66, 'akbar', 0, 0],
    [99, 'akbar', 33, 0],
    [100, 'subhan', 0, 1],
    [250, 'hamd', 17, 2],
  ];
  for (const [total, key, inPhrase, rounds] of cases) {
    const p = position(total);
    assert.deepEqual([p.phrase.key, p.inPhrase, p.rounds], [key, inPhrase, rounds], `total ${total}`);
  }
});

test('the 33rd count finishes a phrase, the 100th a round', () => {
  const now = at('2026-11-21T10:00:00');
  let s = initialState(1, now);
  const milestones: string[] = [];
  for (let i = 1; i <= 100; i++) {
    const r = count(s, now);
    s = r.state;
    if (r.milestone !== 'none') milestones.push(`${i}:${r.milestone}`);
  }
  assert.deepEqual(milestones, ['33:phrase', '66:phrase', '100:round']);
  assert.equal(s.total, 100);
  assert.equal(s.today, 100);
});

test('today starts over at local midnight, the total does not', () => {
  const s0 = { ...initialState(1, at('2026-11-21T23:59:00')), total: 40, today: 40 };
  assert.equal(todayCount(s0, at('2026-11-22T00:01:00')), 0);
  const { state } = count(s0, at('2026-11-22T00:01:00'));
  assert.equal(state.today, 1);
  assert.equal(state.total, 41);
  assert.equal(state.day, '2026-11-22');
});

test('dayKey uses the local calendar day', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});

test('broken storage starts a fresh tree with the fallback seed', () => {
  const now = at('2026-11-21T10:00:00');
  for (const raw of [null, '', 'not json', '{"total":-1,"today":0,"seed":1,"day":"x"}', '{"total":"5"}']) {
    const s = parseState(raw, 77, now);
    assert.equal(s.total, 0, String(raw));
    assert.equal(s.seed, 77);
  }
  const ok = parseState(JSON.stringify({ total: 12, today: 3, seed: 5, day: '2026-11-21' }), 77, now);
  assert.deepEqual(ok, { total: 12, today: 3, seed: 5, day: '2026-11-21' });
});
