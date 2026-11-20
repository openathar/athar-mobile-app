/**
 * The dhikr tree: a tree that grows with every tasbih — the app's picture of
 * "athar", the trace you leave. Drawn from code, not from an image (no
 * third-party media, no figurative art), and fully deterministic: the same
 * seed and the same count always give the same tree, so it can be redrawn
 * from two numbers stored on the device.
 *
 * Pure module (no React Native imports) so it runs under `node --test`.
 */

export type Pt = { x: number; y: number };

export type Segment = {
  /** Quadratic curve: start, control, end. */
  a: Pt;
  c: Pt;
  b: Pt;
  width: number;
  depth: number;
};

/** `seg`: index of the branch the leaf sits on — it opens a little after that branch has grown. */
export type Leaf = { x: number; y: number; angle: number; size: number; seg: number };

export type Tree = {
  segments: Segment[];
  leaves: Leaf[];
};

/** The drawing's coordinate box (square), trunk foot at the bottom centre. */
export const TREE_BOX = 1000;
export const ROOT: Pt = { x: 500, y: 965 };
const MAX_DEPTH = 6;
/** How many branches a leaf waits behind the one that carries it. */
const LEAF_LAG = 12;

/** mulberry32 — the same small PRNG the feelings map uses on the website. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Grows the whole tree for a seed. Segments come out in breadth-first order
 * (trunk first, twigs last) — the order in which they appear while counting.
 * Leaves follow, ordered from the inside out.
 */
export function buildTree(seed: number): Tree {
  const r = rng(seed);
  const segments: Segment[] = [];
  const leaves: Leaf[] = [];
  type Bud = { from: Pt; angle: number; length: number; width: number; depth: number };
  let level: Bud[] = [{ from: ROOT, angle: -90 + (r() - 0.5) * 6, length: 215, width: 26, depth: 0 }];

  while (level.length) {
    const next: Bud[] = [];
    for (const bud of level) {
      const rad = (bud.angle * Math.PI) / 180;
      const b = { x: bud.from.x + Math.cos(rad) * bud.length, y: bud.from.y + Math.sin(rad) * bud.length };
      // A slight bend, so no branch is a ruler line.
      const bend = (r() - 0.5) * bud.length * 0.22;
      const mid = { x: (bud.from.x + b.x) / 2, y: (bud.from.y + b.y) / 2 };
      const c = { x: mid.x - Math.sin(rad) * bend, y: mid.y + Math.cos(rad) * bend };
      segments.push({
        a: { x: round1(bud.from.x), y: round1(bud.from.y) },
        c: { x: round1(c.x), y: round1(c.y) },
        b: { x: round1(b.x), y: round1(b.y) },
        width: round1(bud.width),
        depth: bud.depth,
      });

      if (bud.depth >= 3) {
        const n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const t = 0.45 + r() * 0.55;
          const side = i % 2 === 0 ? 1 : -1;
          leaves.push({
            x: round1(bud.from.x + (b.x - bud.from.x) * t),
            y: round1(bud.from.y + (b.y - bud.from.y) * t),
            angle: Math.round(bud.angle + side * (35 + r() * 30)),
            size: round1(15 + r() * 10 - bud.depth * 0.6),
            seg: segments.length - 1,
          });
        }
      }

      if (bud.depth < MAX_DEPTH) {
        // Mostly forks, sometimes three: an olive more than a fir.
        const kids = bud.depth === 0 ? 3 : r() < 0.28 ? 3 : 2;
        const spread = 22 + r() * 14;
        for (let k = 0; k < kids; k++) {
          const u = k / (kids - 1) - 0.5;
          // Pull everything gently upward so the crown stays a dome.
          const lift = (-90 - bud.angle) * 0.12;
          next.push({
            from: b,
            angle: bud.angle + u * 2 * spread + lift + (r() - 0.5) * 10,
            length: bud.length * (0.7 + r() * 0.1),
            width: Math.max(1.4, bud.width * 0.66),
            depth: bud.depth + 1,
          });
        }
      }
    }
    level = next;
  }
  return { segments, leaves };
}

/** How much of the tree a count has grown: fast at first, slower later, never quite done. */
export function growth(count: number): number {
  if (!(count > 0)) return 0;
  return 1 - Math.exp(-count / 500);
}

/** Point on a quadratic curve. */
function at(s: Segment, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * s.a.x + 2 * u * t * s.c.x + t * t * s.b.x,
    y: u * u * s.a.y + 2 * u * t * s.c.y + t * t * s.b.y,
  };
}

/** The first part of a segment up to t (de Casteljau), for the branch that is still growing. */
export function partial(s: Segment, t: number): Segment {
  if (t >= 1) return s;
  const c = { x: s.a.x + (s.c.x - s.a.x) * t, y: s.a.y + (s.c.y - s.a.y) * t };
  return { ...s, c, b: at(s, t) };
}

export type Visible = {
  segments: Segment[];
  leaves: Leaf[];
  /** Gold blossoms: one per completed round of 100. */
  blossoms: Leaf[];
};

/**
 * What a count shows: the trunk is always there as a sprout, then branches
 * appear in growth order (the newest one partly drawn), leaves following
 * close behind; every
 * full round of 100 opens one gold blossom, spread across the crown.
 */
export function visibleTree(tree: Tree, count: number): Visible {
  const total = tree.segments.length + LEAF_LAG;
  // A seedling before the first tap: a short sprout of the trunk.
  const shown = Math.max(0.12, growth(count) * total);
  const whole = Math.floor(shown);
  const frac = shown - whole;

  const segments = tree.segments.slice(0, Math.min(whole, tree.segments.length));
  if (whole < tree.segments.length && frac > 0) segments.push(partial(tree.segments[whole], frac));

  // Leaves come in a few branches behind the growing tip.
  const leaves = tree.leaves.filter((l) => l.seg + LEAF_LAG < shown);
  const rounds = Math.floor(Math.max(0, count) / 100);
  const blossoms = spread(leaves, Math.min(rounds, leaves.length));
  return { segments, leaves, blossoms };
}

/** Picks n items spread evenly across a list (so blossoms don't cluster on one bough). */
function spread<T>(items: T[], n: number): T[] {
  if (n <= 0) return [];
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(((i + 0.5) * items.length) / n)]);
  return out;
}

/** SVG path for a segment. */
export const segmentPath = (s: Segment) => `M${round1(s.a.x)} ${round1(s.a.y)}Q${round1(s.c.x)} ${round1(s.c.y)} ${round1(s.b.x)} ${round1(s.b.y)}`;

/**
 * SVG path for a leaf (an almond shape) in absolute coordinates, so all
 * leaves can be joined into one path — one native view instead of hundreds.
 */
export function leafPath(leaf: Leaf): string {
  const rad = (leaf.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = (x: number, y: number) => `${round1(leaf.x + x * cos - y * sin)} ${round1(leaf.y + x * sin + y * cos)}`;
  const l = leaf.size;
  const w = leaf.size * 0.42;
  return `M${p(0, 0)}Q${p(l / 2, -w)} ${p(l, 0)}Q${p(l / 2, w)} ${p(0, 0)}Z`;
}

/** Joins segment paths per depth, so the trunk and each generation of twigs is one stroke width. */
export function pathsByDepth(segments: Segment[]): { depth: number; width: number; d: string }[] {
  const out: { depth: number; width: number; d: string }[] = [];
  for (const s of segments) {
    let g = out[s.depth];
    if (!g) g = out[s.depth] = { depth: s.depth, width: s.width, d: '' };
    g.d += segmentPath(s);
  }
  return out.filter(Boolean);
}
