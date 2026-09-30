/**
 * Renders the celestial sprite sheets in assets/images/celestial/.
 *
 * Inputs (next to this script, as 24-bit BMP so no image library is needed):
 *   sips -s format bmp web/public/textures/2k_moon.jpg --out moon.bmp
 *   curl -LO https://www.solarsystemscope.com/textures/download/2k_sun.jpg
 *   sips -s format bmp 2k_sun.jpg --out sun.bmp
 * Then: node render-celestial.mjs, and convert the output BMPs back with
 *   sips -s format jpeg -s formatOptions 80 moon-libration.bmp --out moon-libration.jpg
 *   sips -s format jpeg -s formatOptions 72 sun-rotation.bmp  --out sun-rotation.jpg
 * Textures: Solar System Scope, CC BY 4.0 (see the assets README).
 */
import fs from 'node:fs';
const DEG = Math.PI / 180;

function readBmp(p) {
  const b = fs.readFileSync(p);
  const W = b.readInt32LE(18), H = Math.abs(b.readInt32LE(22)), off = b.readUInt32LE(10);
  return { W, H, px: (x, y) => { const i = off + (y * W + x) * 3; return [b[i + 2], b[i + 1], b[i]]; } };
}

function writeBmp(p, W, H, rgb) {
  const stride = W * 3; // widths used here are multiples of 4
  const buf = Buffer.alloc(54 + stride * H);
  buf.write('BM', 0); buf.writeUInt32LE(buf.length, 2); buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14); buf.writeInt32LE(W, 18); buf.writeInt32LE(-H, 22);
  buf.writeUInt16LE(1, 26); buf.writeUInt16LE(24, 28); buf.writeUInt32LE(stride * H, 34);
  for (let i = 0; i < W * H; i++) { buf[54 + i*3] = rgb[i*3+2]; buf[54 + i*3 + 1] = rgb[i*3+1]; buf[54 + i*3 + 2] = rgb[i*3]; }
  fs.writeFileSync(p, buf);
}

/** Bilinear lookup, u wraps (longitude), v clamps (latitude). */
function sampler(tex) {
  return (u, v) => {
    const x = (((u % 1) + 1) % 1) * tex.W - 0.5, y = Math.min(tex.H - 1, Math.max(0, v * tex.H - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = ((x0 % tex.W) + tex.W) % tex.W, X1 = (X0 + 1) % tex.W, Y1 = Math.min(tex.H - 1, y0 + 1);
    const a = tex.px(X0, y0), b = tex.px(X1, y0), c = tex.px(X0, Y1), d = tex.px(X1, Y1);
    return [0, 1, 2].map(k => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy);
  };
}

/**
 * Orthographic view of a textured sphere. spin turns it about its axis
 * (longitude shift); tilt tips the axis toward/away from the viewer.
 */
function renderSphere(sample, S, spin, tilt, shade) {
  const out = new Float64Array(S * S * 3);
  const R = S / 2 - 0.5, ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    // 2x2 supersampling so the limb is smooth, not stair-stepped
    let acc = [0, 0, 0], hits = 0;
    for (const [sx, sy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const nx = (px + sx - S / 2) / R, ny = -(py + sy - S / 2) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const y0 = ny * ct + nz * st, z0 = -ny * st + nz * ct;
      const lat = Math.asin(Math.max(-1, Math.min(1, y0))), lon = Math.atan2(nx, z0) - spin;
      const c = sample(lon / (2 * Math.PI) + 0.5, 0.5 - lat / Math.PI);
      const f = shade(nz, c);
      if (Array.isArray(f)) { acc[0] += f[0]; acc[1] += f[1]; acc[2] += f[2]; }
      else { acc[0] += c[0] * f; acc[1] += c[1] * f; acc[2] += c[2] * f; }
      hits++;
    }
    const i = (py * S + px) * 3;
    // Outside the disc stays black; the app clips to a circle anyway.
    out[i] = acc[0] / 4; out[i + 1] = acc[1] / 4; out[i + 2] = acc[2] / 4;
  }
  return out;
}

function sheet(name, frames, cols, S) {
  const rows = Math.ceil(frames.length / cols), W = cols * S, H = rows * S;
  const rgb = new Uint8ClampedArray(W * H * 3);
  frames.forEach((f, n) => {
    const ox = (n % cols) * S, oy = Math.floor(n / cols) * S;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let k = 0; k < 3; k++)
      rgb[((oy + y) * W + ox + x) * 3 + k] = f[(y * S + x) * 3 + k];
  });
  writeBmp(`${name}.bmp`, W, H, rgb);
  console.log(`${name}: ${frames.length} frames, ${cols}x${rows} grid of ${S}px → ${W}x${H}`);
}

const t0 = Date.now();
// Moon: a closed libration path — ±14° in longitude, ±6° in latitude, a
// quarter period apart, as the real moon traces it. Mild limb darkening only;
// the phase lighting is applied live in the app.
{
  const sample = sampler(readBmp('moon.bmp'));
  const N = 32, S = 224, frames = [];
  for (let n = 0; n < N; n++) {
    const th = (2 * Math.PI * n) / N;
    frames.push(renderSphere(sample, S, 14 * DEG * Math.sin(th), 6 * DEG * Math.cos(th), nz => 0.82 + 0.18 * nz));
  }
  sheet('moon-libration', frames, 8, S);
}
// Sun: one full turn about its axis (tilted 7.25°). The raw texture is a
// saturated lava orange; it is regraded onto a temperature ramp — white-hot
// centre, gold, then deep orange at the limb (limb darkening) — and only
// its luminance survives, as fine, low-contrast granulation.
{
  const sample = sampler(readBmp('sun.bmp'));
  const ramp = [
    [0.0, [150, 52, 14]],
    [0.35, [226, 104, 30]],
    [0.6, [250, 170, 64]],
    [0.8, [255, 222, 140]],
    [1.0, [255, 250, 232]],
  ];
  const grade = (x) => {
    const t = Math.min(1, Math.max(0, x));
    let i = 0;
    while (i < ramp.length - 2 && t > ramp[i + 1][0]) i++;
    const [t0, c0] = ramp[i], [t1, c1] = ramp[i + 1], k = (t - t0) / (t1 - t0);
    return [0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * k);
  };
  const N = 60, S = 200, frames = [];
  for (let n = 0; n < N; n++) {
    frames.push(renderSphere(sample, S, (2 * Math.PI * n) / N, 7.25 * DEG, (nz, c) => {
      const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
      const granulation = 0.9 + 0.28 * (lum - 0.62);
      const limb = Math.pow(nz, 0.42);
      return grade((0.12 + 0.95 * limb) * granulation);
    }));
  }
  sheet('sun-rotation', frames, 10, S);
}
console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
