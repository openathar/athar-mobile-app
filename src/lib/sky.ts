import { mixHex } from '@/lib/color';

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

type Stop = { alt: number; top: string; bottom: string };

/*
 * Sky colour by sun altitude — zenith (top) and horizon (bottom). Morning and
 * evening differ where the real sky differs: dawn is cool pink and gold,
 * dusk is rose, violet and orange.
 */
const MORNING: Stop[] = [
  { alt: -90, top: '#03050b', bottom: '#060a15' },
  { alt: -18, top: '#04070f', bottom: '#0a1122' },
  { alt: -12, top: '#091026', bottom: '#1b2850' },
  { alt: -6, top: '#142148', bottom: '#46507e' },
  { alt: -2, top: '#27386a', bottom: '#c98c7c' },
  { alt: 2, top: '#4870ad', bottom: '#f0bb8e' },
  { alt: 8, top: '#5b90d2', bottom: '#cfe1f2' },
  { alt: 25, top: '#5a9ade', bottom: '#d9eaf8' },
  { alt: 90, top: '#4e92df', bottom: '#d5e9f9' },
];

const EVENING: Stop[] = [
  { alt: -90, top: '#03050b', bottom: '#060a15' },
  { alt: -18, top: '#04070f', bottom: '#0b1022' },
  { alt: -12, top: '#0c0f2a', bottom: '#241d4a' },
  { alt: -6, top: '#1a1b4a', bottom: '#6b3f6d' },
  { alt: -2, top: '#2b2e63', bottom: '#c65a64' },
  { alt: 2, top: '#4a66a3', bottom: '#f0955a' },
  { alt: 8, top: '#5a8bcb', bottom: '#ecd4ad' },
  { alt: 25, top: '#5a98dc', bottom: '#dcebf7' },
  { alt: 90, top: '#4e92df', bottom: '#d5e9f9' },
];

/** [zenith, horizon] colours for the current sun altitude. */
export function skyGradient(altitude: number, evening: boolean): [string, string] {
  const stops = evening ? EVENING : MORNING;
  let i = 0;
  while (i < stops.length - 2 && altitude > stops[i + 1].alt) i++;
  const a = stops[i];
  const b = stops[i + 1];
  const t = Math.min(1, Math.max(0, (altitude - a.alt) / (b.alt - a.alt)));
  return [mixHex(a.top, b.top, t), mixHex(a.bottom, b.bottom, t)];
}

/** Below this sun altitude the sky is dark enough that light text reads better. */
export const DARK_SKY_BELOW_DEG = 4;

/** Star visibility: gone in daylight, fully out once the sky is properly dark. */
export function starOpacity(altitude: number): number {
  return Math.min(1, Math.max(0, (-altitude - 3) / 9));
}
