const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;

function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / DAY_MS);
}

/** Sun's declination for a date (degrees) — the season, as the lean of the day/night line. */
export function declinationDeg(d: Date): number {
  return -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear(d) + 10));
}

/** Declinations the Earth sprite sheets were rendered for (assets/images/earth). */
export const SHEET_DECLS = [-23, -12, 0, 12, 23] as const;
export type SheetDecl = (typeof SHEET_DECLS)[number];

export function nearestSheet(decl: number): SheetDecl {
  return SHEET_DECLS.reduce((best, s) => (Math.abs(s - decl) < Math.abs(best - decl) ? s : best), SHEET_DECLS[2]);
}

/**
 * Longitude (degrees east, −180..180) of the sub-solar point — where the sun
 * is overhead right now (mean solar time plus the equation of time).
 */
export function subSolarLongitude(d: Date): number {
  const B = ((2 * Math.PI) / 365) * (dayOfYear(d) - 81);
  const eotMin = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const lon = -15 * (utcH - 12 + eotMin / 60);
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export type GlobeSide = 'right' | 'left' | 'plain';

/**
 * The sprites are lit from a fixed side (right or left), so the central
 * meridian is tied to the sun: 90° west of the sub-solar point with the sun
 * on the right, 90° east of it with the sun on the left. A place is on the
 * visible half whenever it is on that side of the sun — so a place in the
 * morning (west of the sun) uses the sun-on-the-right sheets and in the
 * afternoon the sun-on-the-left ones.
 */
export function centralMeridian(d: Date, side: GlobeSide = 'right'): number {
  const s = subSolarLongitude(d);
  return wrap180(side === 'left' ? s + 90 : s - 90);
}

/** Which sheet set keeps `userLon` on the visible half. */
export function sunSideFor(userLon: number, d: Date): GlobeSide {
  return wrap180(userLon - subSolarLongitude(d)) <= 0 ? 'right' : 'left';
}

export const wrap180 = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Sprite frame (36 frames, 10° apart, frame n shows central meridian n·10−180). */
export function frameFor(centralLon: number): number {
  return (wrap180(centralLon) + 180) / 10;
}

/**
 * Screen position of a place on the globe: x right, y up, both −1..1, `z` > 0
 * when it faces the viewer. `lc` is the central meridian, `decl` the lean of
 * the axis toward the sun (the same geometry the sprites were rendered with).
 */
export function project(lat: number, lon: number, lc: number, decl: number) {
  const a = decl * DEG;
  const phi = lat * DEG;
  const lam = (lon - lc) * DEG;
  const u = Math.cos(phi) * Math.sin(lam);
  const s = Math.sin(phi);
  const w = Math.cos(phi) * Math.cos(lam);
  return { x: u * Math.cos(a) + s * Math.sin(a), y: -u * Math.sin(a) + s * Math.cos(a), z: w };
}

/** Points along the great circle from A to B (inclusive). */
export function greatCircle(a: { lat: number; lon: number }, b: { lat: number; lon: number }, steps = 48) {
  const toVec = (p: { lat: number; lon: number }) => {
    const la = p.lat * DEG, lo = p.lon * DEG;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  };
  const va = toVec(a), vb = toVec(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const om = Math.acos(dot);
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k1 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om);
    const k2 = om < 1e-6 ? t : Math.sin(t * om) / Math.sin(om);
    const v = [0, 1, 2].map((j) => k1 * va[j] + k2 * vb[j]);
    out.push({ lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG, lon: Math.atan2(v[1], v[0]) / DEG });
  }
  return out;
}

/** Circular mean of two longitudes — the meridian halfway between them (the short way). */
export function midLongitude(a: number, b: number): number {
  const d = wrap180(b - a);
  return wrap180(a + d / 2);
}
