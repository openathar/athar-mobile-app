import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TREE_BOX, buildTree, growth, leafPath, partial, pathsByDepth, visibleTree } from '@/lib/dhikr-tree';

test('the same seed always grows the same tree', () => {
  assert.deepEqual(buildTree(42), buildTree(42));
});

test('different seeds grow different trees', () => {
  assert.notDeepEqual(buildTree(1).segments, buildTree(2).segments);
});

test('the tree stays inside its drawing box', () => {
  for (const seed of [1, 7, 99, 123456, 2 ** 32 - 1]) {
    const tree = buildTree(seed);
    for (const s of tree.segments) {
      for (const p of [s.a, s.b, s.c]) {
        assert.ok(p.x >= 0 && p.x <= TREE_BOX && p.y >= 0 && p.y <= TREE_BOX, `seed ${seed}: ${JSON.stringify(p)}`);
      }
    }
  }
});

test('growth starts at zero, rises, never reaches one', () => {
  assert.equal(growth(0), 0);
  assert.equal(growth(-5), 0);
  assert.equal(growth(Number.NaN), 0);
  let prev = 0;
  for (const n of [1, 10, 33, 100, 1000, 10000]) {
    const g = growth(n);
    assert.ok(g > prev && g < 1, `growth(${n}) = ${g}`);
    prev = g;
  }
});

test('more counting never shows less tree', () => {
  const tree = buildTree(5);
  let prev = visibleTree(tree, 0);
  for (let n = 1; n <= 3000; n += 37) {
    const v = visibleTree(tree, n);
    assert.ok(v.segments.length >= prev.segments.length, `segments shrank at ${n}`);
    assert.ok(v.leaves.length >= prev.leaves.length, `leaves shrank at ${n}`);
    assert.ok(v.blossoms.length >= prev.blossoms.length, `blossoms shrank at ${n}`);
    prev = v;
  }
});

test('a seedling shows before the first count, the first rounds grow visibly', () => {
  const tree = buildTree(9);
  assert.equal(visibleTree(tree, 0).segments.length, 1);
  assert.ok(visibleTree(tree, 100).segments.length >= 30);
});

test('one gold blossom per round of 100, as long as there are leaves to carry them', () => {
  const tree = buildTree(11);
  assert.equal(visibleTree(tree, 99).blossoms.length, 0);
  assert.equal(visibleTree(tree, 100).blossoms.length, 1);
  assert.equal(visibleTree(tree, 650).blossoms.length, 6);
  const v = visibleTree(tree, 10_000_000);
  assert.equal(v.blossoms.length, v.leaves.length);
});

test('partial branches end on the curve and are whole at t = 1', () => {
  const s = buildTree(3).segments[0];
  assert.deepEqual(partial(s, 1), s);
  const half = partial(s, 0.5);
  assert.deepEqual(half.a, s.a);
  assert.ok(Math.abs(half.b.y - s.a.y) < Math.abs(s.b.y - s.a.y));
});

test('paths are valid SVG (no NaN, one group per depth)', () => {
  const v = visibleTree(buildTree(21), 900);
  const groups = pathsByDepth(v.segments);
  assert.deepEqual(groups.map((g) => g.depth), [...new Set(v.segments.map((s) => s.depth))]);
  for (const g of groups) assert.match(g.d, /^(M[-\d.]+ [-\d.]+Q[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+)+$/);
  for (const l of v.leaves) assert.doesNotMatch(leafPath(l), /NaN/);
});
