/**
 * Renders the rotating Kaaba sprite for the Qibla screen:
 *   node scripts/render-kaaba.mjs  →  assets/images/qibla/kaaba-turn.png
 *
 * A tiny ray caster (no dependencies): an axis-aligned box in true Kaaba
 * proportions (≈12.86 × 11.03 m footprint, 13.1 m high), procedurally
 * textured — black kiswa with a jacquard weave, the gold hizam belt at about
 * two thirds of the height, embroidered lamp motifs below it, the gold door
 * on the north-east wall, the silver frame of the Black Stone at the east
 * corner, and the marble shadhirwan base. Gold carries a specular highlight
 * that travels as the Kaaba turns; a soft contact shadow sits underneath.
 *
 * The real kiswa is woven with Qur'anic verses. They are deliberately NOT
 * imitated here — invented "calligraphy" would be both wrong and
 * disrespectful — so the belt carries geometric cartouches instead.
 *
 * Output: RGBA PNG sprite sheet (frames in a grid ≤ 2048 px per side), one
 * full turn about the vertical axis.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const FRAMES = 40;
const COLS = 8;
const S = 144; // frame size, px
const SS = 3; // supersampling per axis

// Box in metres, normalised so the long wall is 1.
const HX = 0.5; // half-width  (12.86 m wall)
const HZ = 0.5 * (11.03 / 12.86); // half-depth (11.03 m wall)
const H = 13.1 / 12.86; // height

// Camera: slightly above, looking at the upper-middle of the building.
const EL = (17 * Math.PI) / 180;
const DIST = 6.2;
const TARGET = [0, 0.47, 0];
const CAM = [0, TARGET[1] + DIST * Math.sin(EL), DIST * Math.cos(EL)];
const TAN = 0.132; // half field of view (tan)

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const F = norm([TARGET[0] - CAM[0], TARGET[1] - CAM[1], TARGET[2] - CAM[2]]);
const R = norm(cross(F, [0, 1, 0]));
const U = cross(R, F);
const LIGHT = norm([-0.55, 0.8, 0.45]); // world-fixed: the building turns under it

function hash(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const GOLD = [201, 160, 74];
const GOLD_DEEP = [150, 112, 44];
const KISWA = [13, 13, 15];

/** Surface of one wall at (u, v) — u across, v up (0 = ground). Returns [rgb, isGold]. */
function wall(u, v, face) {
  // Marble base (shadhirwan)
  if (v < 0.035) return [[214, 209, 198], false];

  // Door: north-east wall (+z here), near the east corner.
  if (face === 'pz' && u > 0.64 && u < 0.79 && v > 0.16 && v < 0.43) {
    const edge = u < 0.652 || u > 0.778 || v < 0.172 || v > 0.418;
    const panel = Math.abs(u - 0.715) < 0.004; // centre seam between the leaves
    const stud = hash(Math.floor(u * 300), Math.floor(v * 300)) > 0.965;
    const c = edge || panel ? GOLD_DEEP : stud ? [236, 206, 128] : GOLD;
    return [c, true];
  }

  // Black Stone: silver frame at the east corner (+x/+z edge), about 1.5 m up.
  const corner = face === 'pz' ? u > 0.955 : face === 'px' ? u < 0.045 : false;
  if (corner && v > 0.1 && v < 0.155) return [[196, 199, 204], true];

  // Hizam belt at ~2/3 height: gold with geometric cartouches (no text).
  if (v > 0.655 && v < 0.735) {
    const bv = (v - 0.655) / 0.08;
    const border = bv < 0.1 || bv > 0.9;
    const cu = (u * 5) % 1; // five cartouches per wall
    const inCart = Math.abs(cu - 0.5) < 0.42 && bv > 0.22 && bv < 0.78;
    const cartEdge = inCart && (Math.abs(cu - 0.5) > 0.39 || bv < 0.26 || bv > 0.74);
    const lattice = inCart && !cartEdge && (Math.abs(((cu * 6 + bv * 3) % 1) - 0.5) < 0.07 || Math.abs(((cu * 6 - bv * 3 + 9) % 1) - 0.5) < 0.07);
    if (border || cartEdge) return [GOLD_DEEP, true];
    if (lattice) return [[226, 190, 104], true];
    if (inCart) return [[40, 34, 22], false]; // dark ground inside the cartouche
    return [GOLD, true];
  }

  // Embroidered lamp motifs (qanadeel) below the belt.
  const lu = (u * 4) % 1;
  const lampU = Math.abs(lu - 0.5) / 0.07;
  const lampV = Math.abs(v - 0.585) / 0.05;
  if (lampU + lampV < 1) return [lampU + lampV < 0.45 ? GOLD_DEEP : GOLD, true];

  // Kiswa: black silk with a woven jacquard lattice.
  const n = hash(Math.floor(u * 420), Math.floor(v * 420)) * 7 - 3.5;
  const lx = (u * 14 + v * 9) % 1;
  const ly = (u * 14 - v * 9 + 40) % 1;
  const lattice = Math.abs(lx - 0.5) < 0.05 || Math.abs(ly - 0.5) < 0.05 ? 7 : 0;
  return [[KISWA[0] + n + lattice, KISWA[1] + n + lattice, KISWA[2] + n + lattice + 1], false];
}

function roof(u, v) {
  const parapet = u < 0.03 || u > 0.97 || v < 0.03 || v > 0.97;
  const n = hash(Math.floor(u * 200), Math.floor(v * 200)) * 6;
  return parapet ? [[58 + n, 58 + n, 62 + n], false] : [[34 + n, 34 + n, 37 + n], false];
}

/** Trace one ray against the box turned by `theta`. */
function trace(dir, theta) {
  const c = Math.cos(-theta);
  const s = Math.sin(-theta);
  const rot = (v) => [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  const o = rot(CAM);
  const d = rot(dir);
  const lo = [-HX, 0, -HZ];
  const hi = [HX, H, HZ];
  let tmin = -Infinity;
  let tmax = Infinity;
  let axis = -1;
  let sign = 0;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-12) {
      if (o[k] < lo[k] || o[k] > hi[k]) return ground(o, d);
      continue;
    }
    let t1 = (lo[k] - o[k]) / d[k];
    let t2 = (hi[k] - o[k]) / d[k];
    let sg = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      sg = 1;
    }
    if (t1 > tmin) {
      tmin = t1;
      axis = k;
      sign = sg;
    }
    tmax = Math.min(tmax, t2);
  }
  if (tmin > tmax || tmax < 0) return ground(o, d);

  const p = [o[0] + d[0] * tmin, o[1] + d[1] * tmin, o[2] + d[2] * tmin];
  const nObj = [0, 0, 0];
  nObj[axis] = sign;
  let surf;
  if (axis === 1) surf = roof((p[0] + HX) / (2 * HX), (p[2] + HZ) / (2 * HZ));
  else if (axis === 0) surf = wall(sign > 0 ? (HZ - p[2]) / (2 * HZ) : (p[2] + HZ) / (2 * HZ), p[1] / H, sign > 0 ? 'px' : 'nx');
  else surf = wall(sign > 0 ? (p[0] + HX) / (2 * HX) : (HX - p[0]) / (2 * HX), p[1] / H, sign > 0 ? 'pz' : 'nz');

  // Back to world space for lighting (the light does not turn with the building).
  const cw = Math.cos(theta);
  const sw = Math.sin(theta);
  const n = [nObj[0] * cw + nObj[2] * sw, nObj[1], -nObj[0] * sw + nObj[2] * cw];
  const diffuse = 0.3 + 0.7 * Math.max(0, dot(n, LIGHT));
  const [rgb, gold] = surf;
  let spec = 0;
  if (gold) {
    const refl = [2 * dot(n, LIGHT) * n[0] - LIGHT[0], 2 * dot(n, LIGHT) * n[1] - LIGHT[1], 2 * dot(n, LIGHT) * n[2] - LIGHT[2]];
    spec = Math.pow(Math.max(0, -dot(refl, dir)), 18) * 190;
  }
  return { rgb: rgb.map((ch) => Math.min(255, ch * diffuse + spec)), a: 1 };
}

/** Soft contact shadow on the ground plane around the footprint. */
function ground(o, d) {
  if (d[1] >= 0) return null;
  const t = -o[1] / d[1];
  const gx = o[0] + d[0] * t;
  const gz = o[2] + d[2] * t;
  const dx = Math.max(Math.abs(gx) - HX, 0);
  const dz = Math.max(Math.abs(gz) - HZ, 0);
  const dist = Math.hypot(dx, dz);
  // Falls off well inside the frame so it never ends in a hard edge.
  const a = 0.4 * Math.exp(-dist * 16);
  return a > 0.004 ? { rgb: [0, 0, 0], a } : null;
}

function renderFrame(theta) {
  const out = new Uint8Array(S * S * 4);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = ((px + (sx + 0.5) / SS) / S) * 2 - 1;
          const ny = 1 - ((py + (sy + 0.5) / SS) / S) * 2;
          const dir = norm([F[0] + R[0] * nx * TAN + U[0] * ny * TAN, F[1] + R[1] * nx * TAN + U[1] * ny * TAN, F[2] + R[2] * nx * TAN + U[2] * ny * TAN]);
          const hit = trace(dir, theta);
          if (!hit) continue;
          // accumulate premultiplied
          r += hit.rgb[0] * hit.a;
          g += hit.rgb[1] * hit.a;
          b += hit.rgb[2] * hit.a;
          a += hit.a;
        }
      }
      const n = SS * SS;
      const i = (py * S + px) * 4;
      const edge = Math.min(px, py, S - 1 - px, S - 1 - py);
      const alpha = (a / n) * Math.min(1, edge / 6);
      out[i] = alpha > 0 ? Math.round(r / a) : 0;
      out[i + 1] = alpha > 0 ? Math.round(g / a) : 0;
      out[i + 2] = alpha > 0 ? Math.round(b / a) : 0;
      out[i + 3] = Math.round(alpha * 255);
    }
  }
  return out;
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(W, Hh, rgba) {
  const raw = Buffer.alloc((W * 4 + 1) * Hh);
  for (let y = 0; y < Hh; y++) {
    raw[y * (W * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(Hh, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const rows = Math.ceil(FRAMES / COLS);
const W = COLS * S;
const HH = rows * S;
const sheet = new Uint8Array(W * HH * 4);
const t0 = Date.now();
for (let f = 0; f < FRAMES; f++) {
  const frame = renderFrame((2 * Math.PI * f) / FRAMES);
  const ox = (f % COLS) * S;
  const oy = Math.floor(f / COLS) * S;
  for (let y = 0; y < S; y++) sheet.set(frame.subarray(y * S * 4, (y + 1) * S * 4), ((oy + y) * W + ox) * 4);
}
const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets', 'images', 'qibla');
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, 'kaaba-turn.png');
fs.writeFileSync(file, png(W, HH, sheet));
console.log(`${FRAMES} frames ${COLS}x${rows} of ${S}px → ${W}x${HH}, ${(fs.statSync(file).size / 1024).toFixed(0)} KB in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
