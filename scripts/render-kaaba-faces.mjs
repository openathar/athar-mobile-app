/**
 * Renders flat, unlit face textures for the native 3D Kaaba
 * (`src/components/kaaba3d.tsx`):
 *   node scripts/render-kaaba-faces.mjs
 *   → assets/images/qibla/kaaba-nx.png / -px.png / -nz.png / -pz.png / -roof.png
 *
 * Same procedural textures as `render-kaaba.mjs` (kiswa weave, gold hizam
 * belt with geometric cartouches — no imitated calligraphy — door, Black
 * Stone corner, marble shadhirwan base), but sampled directly as flat 2D
 * textures instead of ray-traced: lighting is applied at runtime per frame
 * by the View that wears each texture, since the box turns live.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Box proportions, same normalisation as render-kaaba.mjs (long wall = 1).
const HX = 0.5; // half-width  (12.86 m wall)
const HZ = 0.5 * (11.03 / 12.86); // half-depth (11.03 m wall)
const H = 13.1 / 12.86; // height

const GOLD = [201, 160, 74];
const GOLD_DEEP = [150, 112, 44];
const KISWA = [13, 13, 15];

function hash(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Surface of one wall at (u, v) — u across, v up (0 = ground). Returns [rgb]. */
function wall(u, v, face) {
  if (v < 0.035) return [214, 209, 198]; // marble base (shadhirwan)

  // Door: the wall facing the Kaaba's door (here: +z), near the east corner.
  if (face === 'pz' && u > 0.64 && u < 0.79 && v > 0.16 && v < 0.43) {
    const edge = u < 0.652 || u > 0.778 || v < 0.172 || v > 0.418;
    const panel = Math.abs(u - 0.715) < 0.004;
    const stud = hash(Math.floor(u * 300), Math.floor(v * 300)) > 0.965;
    return edge || panel ? GOLD_DEEP : stud ? [236, 206, 128] : GOLD;
  }

  // Black Stone: silver frame at the east corner (+x/+z edge).
  const corner = face === 'pz' ? u > 0.955 : face === 'px' ? u < 0.045 : false;
  if (corner && v > 0.1 && v < 0.155) return [196, 199, 204];

  // Hizam belt at ~2/3 height: gold with geometric cartouches (no text).
  if (v > 0.655 && v < 0.735) {
    const bv = (v - 0.655) / 0.08;
    const border = bv < 0.1 || bv > 0.9;
    const cu = (u * 5) % 1;
    const inCart = Math.abs(cu - 0.5) < 0.42 && bv > 0.22 && bv < 0.78;
    const cartEdge = inCart && (Math.abs(cu - 0.5) > 0.39 || bv < 0.26 || bv > 0.74);
    const lattice =
      inCart &&
      !cartEdge &&
      (Math.abs(((cu * 6 + bv * 3) % 1) - 0.5) < 0.07 || Math.abs(((cu * 6 - bv * 3 + 9) % 1) - 0.5) < 0.07);
    if (border || cartEdge) return GOLD_DEEP;
    if (lattice) return [226, 190, 104];
    if (inCart) return [40, 34, 22];
    return GOLD;
  }

  // Embroidered lamp motifs (qanadeel) below the belt.
  const lu = (u * 4) % 1;
  const lampU = Math.abs(lu - 0.5) / 0.07;
  const lampV = Math.abs(v - 0.585) / 0.05;
  if (lampU + lampV < 1) return lampU + lampV < 0.45 ? GOLD_DEEP : GOLD;

  // Kiswa: black silk with a woven jacquard lattice.
  const n = hash(Math.floor(u * 420), Math.floor(v * 420)) * 7 - 3.5;
  const lx = (u * 14 + v * 9) % 1;
  const ly = (u * 14 - v * 9 + 40) % 1;
  const lattice = Math.abs(lx - 0.5) < 0.05 || Math.abs(ly - 0.5) < 0.05 ? 7 : 0;
  return [KISWA[0] + n + lattice, KISWA[1] + n + lattice, KISWA[2] + n + lattice + 1];
}

function roof(u, v) {
  const parapet = u < 0.03 || u > 0.97 || v < 0.03 || v > 0.97;
  const n = hash(Math.floor(u * 200), Math.floor(v * 200)) * 6;
  return parapet ? [58 + n, 58 + n, 62 + n] : [34 + n, 34 + n, 37 + n];
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

const SS = 3; // supersampling per axis

/** Render one face as a flat texture. `sampler(u, v)` returns rgb, u/v in 0..1 (v: 0 bottom .. 1 top). */
function renderFace(W, Hh, sampler) {
  const out = new Uint8Array(W * Hh * 4);
  for (let py = 0; py < Hh; py++) {
    for (let px = 0; px < W; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (px + (sx + 0.5) / SS) / W;
          const v = 1 - (py + (sy + 0.5) / SS) / Hh; // flip: image row 0 is the top
          const [rr, gg, bb] = sampler(u, v);
          r += rr;
          g += gg;
          b += bb;
        }
      }
      const n = SS * SS;
      const i = (py * W + px) * 4;
      out[i] = Math.round(Math.min(255, Math.max(0, r / n)));
      out[i + 1] = Math.round(Math.min(255, Math.max(0, g / n)));
      out[i + 2] = Math.round(Math.min(255, Math.max(0, b / n)));
      out[i + 3] = 255;
    }
  }
  return out;
}

const WALL_TEX = 512; // px, long wall (pz/nz) width and every wall's height
const SHORT_W = Math.round(WALL_TEX * (HZ / HX)); // px/nx width
const WALL_H = Math.round(WALL_TEX * (H / (2 * HX)));
const ROOF_W = WALL_TEX;
const ROOF_H = Math.round(WALL_TEX * (HZ / HX));

const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets', 'images', 'qibla');
fs.mkdirSync(outDir, { recursive: true });

const faces = [
  { name: 'pz', w: WALL_TEX, h: WALL_H, sampler: (u, v) => wall(u, v, 'pz') },
  { name: 'nz', w: WALL_TEX, h: WALL_H, sampler: (u, v) => wall(u, v, 'nz') },
  { name: 'px', w: SHORT_W, h: WALL_H, sampler: (u, v) => wall(u, v, 'px') },
  { name: 'nx', w: SHORT_W, h: WALL_H, sampler: (u, v) => wall(u, v, 'nx') },
  { name: 'roof', w: ROOF_W, h: ROOF_H, sampler: (u, v) => roof(u, v) },
];

const t0 = Date.now();
for (const f of faces) {
  const rgba = renderFace(f.w, f.h, f.sampler);
  const file = path.join(outDir, `kaaba-${f.name}.png`);
  fs.writeFileSync(file, png(f.w, f.h, rgba));
  console.log(`${f.name}: ${f.w}x${f.h} → ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
