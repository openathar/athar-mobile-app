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

type Stop = { alt: number; color: string };

/*
 * The page colour through the day — one flat colour per moment, no gradient.
 * It follows the sun's altitude and differs between morning and evening:
 * night navy → cold blue-grey before Fajr → pale warm paper at sunrise → day
 * paper → amber paper at Asr → dusky rose-brown at Maghrib → navy at Isha.
 */
const MORNING: Stop[] = [
  { alt: -90, color: '#0b0f17' },
  { alt: -18, color: '#0b0f17' },
  { alt: -12, color: '#0e1524' },
  { alt: -6, color: '#18243b' },
  { alt: -2, color: '#2b3652' },
  { alt: 0, color: '#d8c7ad' },
  { alt: 5, color: '#efe3cc' },
  { alt: 14, color: '#f7efdd' },
  { alt: 90, color: '#faf5ea' },
];

const EVENING: Stop[] = [
  { alt: -90, color: '#0b0f17' },
  { alt: -18, color: '#0b0f17' },
  { alt: -12, color: '#10162a' },
  { alt: -6, color: '#201d33' },
  { alt: -2, color: '#37292f' },
  { alt: 0, color: '#4a3336' },
  { alt: 4, color: '#e6c99f' },
  { alt: 14, color: '#f1e2c0' },
  { alt: 30, color: '#f7ecd5' },
  { alt: 90, color: '#faf5ea' },
];

/** The flat page colour for the current sun altitude. */
export function skyColor(altitude: number, evening: boolean): string {
  const stops = evening ? EVENING : MORNING;
  let i = 0;
  while (i < stops.length - 2 && altitude > stops[i + 1].alt) i++;
  const a = stops[i];
  const b = stops[i + 1];
  const t = Math.min(1, Math.max(0, (altitude - a.alt) / (b.alt - a.alt)));
  return mixHex(a.color, b.color, t);
}

/** Relative luminance 0..1 of a #rrggbb colour (sRGB, rough but enough to pick light or dark text). */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** Star visibility: gone in daylight, fully out once the sky is properly dark. */
export function starOpacity(altitude: number): number {
  return Math.min(1, Math.max(0, (-altitude - 3) / 9));
}
