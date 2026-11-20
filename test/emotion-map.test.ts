import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAP_H, MAP_W, TEXT_IDS, belly, chest, clusters, counterpartOf, placed } from '@/data/emotion-map';

test('133 feelings, as on the website: 80 branches in the chest, 53 roots in the belly', () => {
  assert.equal(chest.length, 80);
  assert.equal(belly.length, 53);
  assert.equal(placed.length, 133);
});

test('every feeling has a unique id and names in all three content languages', () => {
  assert.equal(new Set(placed.map((p) => p.id)).size, placed.length);
  for (const p of placed) for (const l of ['ar', 'en', 'de'] as const) assert.ok(p[l].trim(), `${p.id}.${l}`);
});

test('counterparts point both ways and exist on the tree', () => {
  const ids = new Set(placed.map((p) => p.id));
  for (const p of placed) {
    const c = counterpartOf(p.id);
    if (!c) continue;
    assert.ok(ids.has(c), `${p.id} → ${c}`);
    assert.equal(counterpartOf(c), p.id);
  }
  for (const id of TEXT_IDS) assert.ok(ids.has(id), id);
});

test('every tip lies on the drawing and every feeling sits in one cluster', () => {
  for (const p of placed) {
    assert.ok(p.tip.x > -170 && p.tip.x < MAP_W + 170 && p.tip.y > 0 && p.tip.y < MAP_H, p.id);
  }
  const members = clusters.flatMap((c) => c.members).sort((a, b) => a - b);
  assert.deepEqual(members, placed.map((_, i) => i));
});
