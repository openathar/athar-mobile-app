/**
 * Renders the moon PHASE sprite sheet (assets/images/celestial/moon-phases.jpg).
 *
 * Goal: the same moon as the website's hero (web/components/lp/moon-stage.tsx), not a texture with a
 * translucent shadow painted over it. So this reproduces that scene's lighting per pixel:
 *   - directional light #fff6e8, intensity 2.3, Lambert (roughness 1),
 *   - earthshine: emissive #7f93b4 x texture x 0.14 (the night side is never black),
 *   - ambient 0.04,
 *   - ACES filmic tone mapping + sRGB output (react-three-fiber's defaults).
 * The sun direction follows the phase exactly as the website derives it from the elongation.
 *
 * 30 frames (about one per day of the lunation), 340 px, 6x5 grid = 2040x1700 px (<= 2048 per side).
 * Frame k shows lunation fraction k/30: 0 = new moon, 15 = full moon, waxing = lit on the right
 * (northern-hemisphere view). The app crossfades neighbouring frames, so any minute in between works.
 *
 * Input (24-bit BMP, no image library needed):
 *   mkdir -p /tmp/moon && sips -s format bmp web/public/textures/2k_moon.jpg --out /tmp/moon/moon.bmp
 * Run:  node render-moon-phases.mjs   (writes ./moon-phases.bmp)
 * Then: sips -s format jpeg -s formatOptions 88 moon-phases.bmp --out ../assets/images/celestial/moon-phases.jpg
 *
 * Texture: Solar System Scope 2k_moon.jpg (NASA data, CC BY 4.0) — the same file the website uses.
 */
import fs from 'node:fs';

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

const tex = readBmp('/tmp/moon/moon.bmp');
function sample(u, v) {
  const x = (((u % 1) + 1) % 1) * tex.W - 0.5, y = Math.min(tex.H - 1, Math.max(0, v * tex.H - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const X0 = ((x0 % tex.W) + tex.W) % tex.W, X1 = (X0 + 1) % tex.W, Y0 = Math.max(0, y0), Y1 = Math.min(tex.H - 1, y0 + 1);
  const a = tex.px(X0, Y0), b = tex.px(X1, Y0), c = tex.px(X0, Y1), d = tex.px(X1, Y1);
  return [0, 1, 2].map((k) => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy);
}

const toLin = (c) => Math.pow(c / 255, 2.2);
const LIGHT = [1, toLin(246), toLin(232)];           // #fff6e8
const EMISSIVE = [toLin(0x7f), toLin(0x93), toLin(0xb4)]; // #7f93b4
const SUN = 2.3, EARTHSHINE = 0.14, AMBIENT = 0.04;

// three.js ACESFilmicToneMapping (exposure 1): color *= 1/0.6, RRT+ODT fit between two matrices.
function aces(c) {
  const v = c.map((x) => x / 0.6);
  const inp = [
    0.59719 * v[0] + 0.35458 * v[1] + 0.04823 * v[2],
    0.07600 * v[0] + 0.90834 * v[1] + 0.01566 * v[2],
    0.02840 * v[0] + 0.13383 * v[1] + 0.83777 * v[2],
  ];
  const fit = inp.map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
  return [
    1.60475 * fit[0] - 0.53108 * fit[1] - 0.07367 * fit[2],
    -0.10208 * fit[0] + 1.10813 * fit[1] - 0.00605 * fit[2],
    -0.00327 * fit[0] - 0.07276 * fit[1] + 1.07602 * fit[2],
  ].map((x) => Math.min(1, Math.max(0, x)));
}
const toSrgb = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

function frame(S, alpha) {
  // View space: x right, y up, z toward the viewer (Earth). Same sun as the website:
  // sunPos = [-cos(e) * 8, 0.6, sin(e) * 8] seen from the Earth direction.
  let sx = Math.sin(alpha), sy = 0.075, sz = -Math.cos(alpha);
  const sl = Math.hypot(sx, sy, sz); sx /= sl; sy /= sl; sz /= sl;
  const out = new Float64Array(S * S * 3);
  const R = S / 2 - 1;
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const acc = [0, 0, 0];
    for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const nx = (px + ox - S / 2) / R, ny = -(py + oy - S / 2) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const lat = Math.asin(ny), lon = Math.atan2(nx, nz);
      const t = sample(lon / (2 * Math.PI) + 0.5, 0.5 - lat / Math.PI);
      const alb = t.map(toLin);
      const ndl = Math.max(0, nx * sx + ny * sy + nz * sz);
      const lin = alb.map((a, k) => a * (SUN / Math.PI) * ndl * LIGHT[k] + a * EMISSIVE[k] * EARTHSHINE + (a * AMBIENT) / Math.PI);
      const m = aces(lin);
      for (let k = 0; k < 3; k++) acc[k] += toSrgb(m[k]);
    }
    const i = (py * S + px) * 3;
    out[i] = acc[0] / 4; out[i + 1] = acc[1] / 4; out[i + 2] = acc[2] / 4;
  }
  return out;
}

const S = 340, N = 30, cols = 6, rows = 5;
const W = cols * S, H = rows * S, rgb = new Uint8ClampedArray(W * H * 3);
for (let n = 0; n < N; n++) {
  const f = frame(S, (2 * Math.PI * n) / N);
  const ox = (n % cols) * S, oy = Math.floor(n / cols) * S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let k = 0; k < 3; k++) rgb[((oy + y) * W + ox + x) * 3 + k] = f[(y * S + x) * 3 + k];
}
writeBmp('moon-phases.bmp', W, H, rgb);
console.log(`moon-phases.bmp ${W}x${H}, ${N} frames`);
