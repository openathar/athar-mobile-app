/**
 * Renders the moon sprite sheets in assets/images/celestial/:
 *
 *   moon-libration.jpg  24 frames, 6x4 grid of 340 px (2040x1360): the near side along a closed
 *                       libration path (about +-10 deg longitude, +-5 deg latitude), UNLIT.
 *   moon-shade.png      30 frames, 6x5 grid of 340 px (2040x1700), RGBA: the shadow of lunation
 *                       fraction k/30 as a navy overlay whose alpha is the darkness. Frame 0 = new
 *                       moon, 15 = full moon, waxing lit on the right.
 *
 * Why two layers: the surface moves (libration) under a shadow that stays where the sun puts it,
 * like the website's 3D moon (surface turning under a fixed light). A single baked sprite per phase
 * could not move.
 *
 * The shade reproduces the website's lighting (web/components/lp/moon-stage.tsx): warm directional
 * light 2.3, blue earthshine, ambient 0.04, ACES tone mapping. It is applied as a multiplier relative
 * to the fully lit moon, so the lit side shows the texture as it is.
 *
 * Input (24-bit BMP, no image library needed):
 *   mkdir -p /tmp/moon && sips -s format bmp web/public/textures/2k_moon.jpg --out /tmp/moon/moon.bmp
 * Run:  node render-moon.mjs  (writes moon-libration.bmp and moon-shade.png here)
 * Then: sips -s format jpeg -s formatOptions 90 moon-libration.bmp --out ../assets/images/celestial/moon-libration.jpg
 *       mv moon-shade.png ../assets/images/celestial/
 *
 * Texture: Solar System Scope 2k_moon.jpg (NASA data, CC BY 4.0) — the website's file.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

function readBmp(p) {
  const b = fs.readFileSync(p);
  const W = b.readInt32LE(18), H = Math.abs(b.readInt32LE(22)), off = b.readUInt32LE(10);
  const flip = b.readInt32LE(22) > 0;
  const row = Math.ceil((W * 3) / 4) * 4;
  return { W, H, px: (x, y) => { const yy = flip ? H - 1 - y : y; const i = off + yy * row + x * 3; return [b[i + 2], b[i + 1], b[i]]; } };
}
function writeBmp(p, W, H, rgb) {
  const stride = W * 3;
  const buf = Buffer.alloc(54 + stride * H);
  buf.write('BM', 0); buf.writeUInt32LE(buf.length, 2); buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14); buf.writeInt32LE(W, 18); buf.writeInt32LE(-H, 22);
  buf.writeUInt16LE(1, 26); buf.writeUInt16LE(24, 28); buf.writeUInt32LE(stride * H, 34);
  for (let i = 0; i < W * H; i++) { buf[54 + i * 3] = rgb[i * 3 + 2]; buf[54 + i * 3 + 1] = rgb[i * 3 + 1]; buf[54 + i * 3 + 2] = rgb[i * 3]; }
  fs.writeFileSync(p, buf);
}
// Minimal PNG writer (RGBA, filter 0) so no image library is needed.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(p, W, H, rgba) {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(p, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

const tex = readBmp('/tmp/moon/moon.bmp');
function sample(u, v) {
  const x = (((u % 1) + 1) % 1) * tex.W - 0.5, y = Math.min(tex.H - 1, Math.max(0, v * tex.H - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const X0 = ((x0 % tex.W) + tex.W) % tex.W, X1 = (X0 + 1) % tex.W, Y0 = Math.max(0, y0), Y1 = Math.min(tex.H - 1, y0 + 1);
  const a = tex.px(X0, Y0), b = tex.px(X1, Y0), c = tex.px(X0, Y1), d = tex.px(X1, Y1);
  return [0, 1, 2].map((k) => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy);
}

/** The website's moon is a little brighter than the raw texture (warm light, ACES); lift the lit surface to match. */
const GAIN = 1.28;
const S = 340, R = S / 2 - 1;
const SS = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];

// ---- libration (unlit) ------------------------------------------------------------------------------
function libration(lonDeg, latDeg) {
  const l = (lonDeg * Math.PI) / 180, p = (latDeg * Math.PI) / 180;
  const out = new Float64Array(S * S * 3);
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const acc = [0, 0, 0];
    for (const [ox, oy] of SS) {
      const nx = (px + ox - S / 2) / R, ny = -(py + oy - S / 2) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const y1 = ny * Math.cos(p) + nz * Math.sin(p), z1 = -ny * Math.sin(p) + nz * Math.cos(p);
      const x2 = nx * Math.cos(l) + z1 * Math.sin(l), z2 = -nx * Math.sin(l) + z1 * Math.cos(l);
      const t = sample(Math.atan2(x2, z2) / (2 * Math.PI) + 0.5, 0.5 - Math.asin(y1) / Math.PI);
      for (let k = 0; k < 3; k++) acc[k] += Math.min(255, t[k] * GAIN);
    }
    const i = (py * S + px) * 3;
    out[i] = acc[0] / 4; out[i + 1] = acc[1] / 4; out[i + 2] = acc[2] / 4;
  }
  return out;
}

// ---- shade (phase) ----------------------------------------------------------------------------------
const toLin = (c) => Math.pow(c / 255, 2.2);
const toSrgb = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
function aces(x) {
  const v = x / 0.6;
  // grey-scale use of three.js' ACES filmic fit (same matrices applied to a neutral colour)
  const i = [0.59719 + 0.35458 + 0.04823, 0.076 + 0.90834 + 0.01566, 0.0284 + 0.13383 + 0.83777].map((m) => m * v);
  const f = i.map((q) => (q * (q + 0.0245786) - 0.000090537) / (q * (0.983729 * q + 0.432951) + 0.238081));
  return Math.min(1, Math.max(0, 1.60475 * f[0] - 0.53108 * f[1] - 0.07367 * f[2]));
}
const A0 = 0.22; // a typical albedo (linear); only the RATIO between lit and shaded matters
const out = (ndl) => toSrgb(aces(A0 * ((2.3 / Math.PI) * ndl + 0.14 * 0.3 + 0.04 / Math.PI)));
const FULL = out(1);
const NAVY = [8, 12, 22];

function shade(alpha) {
  let sx = Math.sin(alpha), sy = 0.075, sz = -Math.cos(alpha);
  const sl = Math.hypot(sx, sy, sz); sx /= sl; sy /= sl; sz /= sl;
  const px4 = new Uint8ClampedArray(S * S * 4);
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    let dark = 0, cover = 0;
    for (const [ox, oy] of SS) {
      const nx = (px + ox - S / 2) / R, ny = -(py + oy - S / 2) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const ndl = Math.max(0, nx * sx + ny * sy + nz * sz);
      dark += 1 - Math.min(1, out(ndl) / FULL);
      cover += 1;
    }
    const i = (py * S + px) * 4;
    if (cover) {
      px4[i] = NAVY[0]; px4[i + 1] = NAVY[1]; px4[i + 2] = NAVY[2];
      px4[i + 3] = Math.round((dark / cover) * 255);
    }
  }
  return px4;
}

// ---- sheets ------------------------------------------------------------------------------------------
{
  const N = 24, cols = 6, rows = 4, W = cols * S, H = rows * S, rgb = new Uint8ClampedArray(W * H * 3);
  for (let n = 0; n < N; n++) {
    const t = (2 * Math.PI * n) / N;
    const f = libration(10 * Math.sin(t), 5 * Math.sin(2 * t + 1.0));
    const ox = (n % cols) * S, oy = Math.floor(n / cols) * S;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let k = 0; k < 3; k++) rgb[((oy + y) * W + ox + x) * 3 + k] = f[(y * S + x) * 3 + k];
  }
  writeBmp('moon-libration.bmp', W, H, rgb);
  console.log(`moon-libration.bmp ${W}x${H}, ${N} frames`);
}
{
  const N = 30, cols = 6, rows = 5, W = cols * S, H = rows * S, rgba = new Uint8ClampedArray(W * H * 4);
  for (let n = 0; n < N; n++) {
    const f = shade((2 * Math.PI * n) / N);
    const ox = (n % cols) * S, oy = Math.floor(n / cols) * S;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let k = 0; k < 4; k++) rgba[((oy + y) * W + ox + x) * 4 + k] = f[(y * S + x) * 4 + k];
  }
  writePng('moon-shade.png', W, H, rgba);
  console.log(`moon-shade.png ${W}x${H}, ${N} frames, darkest-at-limb ratio at full moon: ${(1 - out(0.0) / FULL).toFixed(2)}`);
}
