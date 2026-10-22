const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;

function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / DAY_MS);
}

/**
 * The sun's altitude in degrees, from solar declination and the hour angle
 * relative to today's transit (Dhuhr). Same model as the armillary sphere,
 * where it was checked against MWL prayer times (sunrise/maghrib ≈ −0.83°,
 * Fajr −18°, Isha −17°).
 */
export function sunAltitudeDeg(now: Date, latitude: number, transitMs: number): number {
  const decl = -23.44 * DEG * Math.cos(((2 * Math.PI) / 365) * (dayOfYear(now) + 10));
  const H = (2 * Math.PI * (now.getTime() - transitMs)) / DAY_MS;
  const phi = latitude * DEG;
  const s = Math.sin(decl) * Math.sin(phi) + Math.cos(decl) * Math.cos(H) * Math.cos(phi);
  return Math.asin(Math.max(-1, Math.min(1, s))) / DEG;
}

/**
 * 0 at night, 1 by day — a smoothstep across the twilight band around the
 * horizon (−4° … +4°, roughly twenty minutes either side of sunrise/sunset).
 */
export function daylight(altitude: number): number {
  const t = Math.min(1, Math.max(0, (altitude + 4) / 8));
  return t * t * (3 - 2 * t);
}

/** Star visibility: gone in daylight, fully out once the sky is properly dark. */
export function starOpacity(altitude: number): number {
  return Math.min(1, Math.max(0, (-altitude - 3) / 9));
}
