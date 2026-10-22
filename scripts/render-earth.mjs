/**
 * Renders the Earth sprite sheets in assets/images/earth/ — the same planet
 * as the website's 3D scene (NASA / Solar System Scope textures, CC BY 4.0):
 * day map with clouds, city lights on the night side, a soft computed
 * terminator and a thin atmosphere rim, lit from the right (the sun is fixed
 * on screen; the app turns the sheet frame with the real time of day).
 *
 * One sheet per solar declination (−23, −12, 0, +12, +23°), 36 frames (one
 * full turn, 10° apart) in a 6×6 grid of 340 px. The app picks the sheet
 * closest to today's declination, so the tilt of the day/night line follows
 * the season.
 *
 * Inputs in /tmp/earth as 24-bit BMP (no image library needed):
 *   sips -s format bmp web/public/textures/2k_earth_daymap.jpg --out /tmp/earth/daymap.bmp
 *   (same for nightmap and clouds)
 * Run:  node render-earth.mjs   — then convert each BMP:
 *   sips -s format jpeg -s formatOptions 84 earth-d0.bmp --out ../assets/images/earth/earth-d0.jpg
 */
import fs from 'node:fs';
const DEG = Math.PI / 180;

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
function sampler(tex) {
  return (u, v) => {
    const x = (((u % 1) + 1) % 1) * tex.W - 0.5, y = Math.min(tex.H - 1, Math.max(0, v * tex.H - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = ((x0 % tex.W) + tex.W) % tex.W, X1 = (X0 + 1) % tex.W, Y0 = Math.max(0, y0), Y1 = Math.min(tex.H - 1, y0 + 1);
    const a = tex.px(X0, Y0), b = tex.px(X1, Y0), c = tex.px(X0, Y1), d = tex.px(X1, Y1);
    return [0, 1, 2].map((k) => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy);
  };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const day = sampler(readBmp('/tmp/earth/daymap.bmp'));
const night = sampler(readBmp('/tmp/earth/nightmap.bmp'));
const clouds = sampler(readBmp('/tmp/earth/clouds.bmp'));

function frame(S, lc, a, sign = 1, plain = false) {
  const out = new Float64Array(S * S * 3);
  const R = S / 2 - 0.5, ca = Math.cos(a), sa = Math.sin(a);
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const acc = [0, 0, 0];
    for (const [sx, sy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const nx = (px + sx - S / 2) / R, ny = -(py + sy - S / 2) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      // earth frame: axis leans toward the sun by a
      const sux = nx * sign; // the sun's side: +1 right, -1 left
      const lat = Math.asin(Math.max(-1, Math.min(1, nx * sa + ny * ca)));
      const u = nx * ca - ny * sa;
      const lon = Math.atan2(u, nz) + lc;
      const U = lon / (2 * Math.PI) + 0.5, V = 0.5 - lat / Math.PI;
      const d = day(U, V), n = night(U, V), c = clouds(U, V);
      const cl = c[0] / 255;
      if (plain) {
        // No day/night line: an evenly lit globe for the Qibla map, light from the upper left.
        const sh = 0.5 + 0.5 * Math.max(0, -0.3 * nx + 0.5 * ny + 0.82 * nz);
        const cm = Math.min(0.8, cl * 0.85);
        const rimp = Math.pow(1 - nz, 3.2) * 0.45;
        for (let k = 0; k < 3; k++) acc[k] += (d[k] * (1 - cm) + 242 * cm) * sh + [90, 150, 255][k] * rimp * 0.5;
        continue;
      }
      const lit = smooth(-0.12, 0.30, sux);          // soft terminator
      const dark = 1 - smooth(-0.30, 0.04, sux);     // night side weight
      // day side: map + clouds, shaded by the sun angle
      const shade = 0.16 + 0.95 * Math.max(0, sux) ** 0.8;
      const cloudMix = Math.min(0.85, cl * 0.9);
      const dc = [0, 1, 2].map((k) => (d[k] * (1 - cloudMix) + 244 * cloudMix) * shade);
      // night side: faint blue ground, city lights
      const lights = [0, 1, 2].map((k) => n[k] * 1.5 * dark);
      const nc = [0, 1, 2].map((k, i) => d[k] * [0.025, 0.035, 0.06][i] + lights[k]);
      // twilight warmth just past the terminator
      const warm = smooth(-0.14, 0.0, sux) * (1 - smooth(0.0, 0.16, sux)) * 0.06;
      const rim = Math.pow(1 - nz, 3.2) * (0.12 + 0.88 * smooth(-0.3, 0.6, sux));
      for (let k = 0; k < 3; k++) {
        const base = dc[k] * lit + nc[k] * (1 - lit);
        acc[k] += base + [255, 120, 40][k] * warm * 0.4 + [90, 150, 255][k] * rim * 0.55;
      }
    }
    const i = (py * S + px) * 3;
    out[i] = Math.min(255, acc[0] / 4); out[i + 1] = Math.min(255, acc[1] / 4); out[i + 2] = Math.min(255, acc[2] / 4);
  }
  return out;
}

const S = 340, N = 36, cols = 6, rows = 6;
const t0 = Date.now();
function sheet(name, decl, sign, plain) {
  const W = cols * S, H = rows * S, rgb = new Uint8ClampedArray(W * H * 3);
  for (let n = 0; n < N; n++) {
    // the axis leans toward the sun: right for sign +1, left for -1
    const f = frame(S, ((n * 10) - 180) * DEG, sign * decl * DEG, sign, plain);
    const ox = (n % cols) * S, oy = Math.floor(n / cols) * S;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let k = 0; k < 3; k++) rgb[((oy + y) * W + ox + x) * 3 + k] = f[(y * S + x) * 3 + k];
  }
  writeBmp(`${name}.bmp`, W, H, rgb);
  console.log(`${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
// usage: node render-earth.mjs right|left|plain
const mode = process.argv[2] || 'right';
if (mode === 'plain') sheet('earth-plain', 0, 1, true);
else for (const decl of [-23, -12, 0, 12, 23]) sheet(mode === 'left' ? `earth-L-d${decl}` : `earth-d${decl}`, decl, mode === 'left' ? -1 : 1, false);
