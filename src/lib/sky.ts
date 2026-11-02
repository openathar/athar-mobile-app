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
type Palette = { morning: Stop[]; evening: Stop[] };

/*
 * The page colour through the day: one flat colour per moment, no gradient,
 * following the sun's altitude, different in the morning and the evening.
 * Every phase is a stone: obsidian at night, sapphire and lapis lazuli in the
 * last third of the night and at Fajr, cobalt in the blue hour, pearl at
 * sunrise, porcelain by day, jade mist at Asr, silver mist before Maghrib,
 * then a jewel for Maghrib (garnet or emerald). The dark↔light change at the
 * horizon happens within 0.2° of sun altitude (about a minute), so the page
 * never passes through the muddy mid-tones a straight blend produces.
 */
const MORNING: Stop[] = [
  { alt: -90, color: '#0a0d14' }, // obsidian
  { alt: -18, color: '#0a0d14' },
  { alt: -15, color: '#0d1530' }, // sapphire — before Fajr
  { alt: -9, color: '#152457' }, // lapis lazuli — Fajr
  { alt: -3, color: '#1f3278' }, // cobalt — blue hour
  { alt: -0.95, color: '#273d8c' },
  // Sunrise is at −0.83°: the page turns to pearl within 0.2° (about a minute).
  { alt: -0.75, color: '#eceff4' }, // pearl — sunrise
  { alt: 8, color: '#f1f2f2' },
  { alt: 90, color: '#f6f6f3' }, // porcelain
];

/*
 * The day has no yellow: the light stays cool and quiet, like stone. In a
 * Central European winter the sun never climbs past ~22°, so the afternoon
 * tones are tied to low altitudes and every season sees them.
 */
const DAY_TO_DUSK: Stop[] = [
  { alt: 90, color: '#f6f6f3' }, // porcelain
  { alt: 18, color: '#f3f4f0' },
  { alt: 11, color: '#e8eee9' }, // jade mist — Asr
  { alt: 5, color: '#e1e7ec' }, // silver mist — before Maghrib
  { alt: -0.6, color: '#dae1ea' },
];

const DUSK_TO_NIGHT: Record<'garnet' | 'emerald', Stop[]> = {
  // Maghrib in garnet: a deep wine red fading into amethyst-indigo.
  garnet: [
    { alt: -0.8, color: '#47182a' },
    { alt: -4, color: '#381628' },
    { alt: -8, color: '#22193f' }, // amethyst
    { alt: -13, color: '#121633' },
    { alt: -18, color: '#0a0d14' },
    { alt: -90, color: '#0a0d14' },
  ],
  // Maghrib in emerald: deep green fading through petrol into night blue.
  emerald: [
    { alt: -0.8, color: '#0f3a32' },
    { alt: -4, color: '#0d3036' },
    { alt: -8, color: '#10233f' },
    { alt: -13, color: '#0f1631' },
    { alt: -18, color: '#0a0d14' },
    { alt: -90, color: '#0a0d14' },
  ],
};

const reverse = (stops: Stop[]) => [...stops].sort((a, b) => a.alt - b.alt);

export type DuskStone = 'garnet' | 'emerald';

const PALETTES: Record<DuskStone, Palette> = {
  garnet: { morning: MORNING, evening: reverse([...DAY_TO_DUSK, ...DUSK_TO_NIGHT.garnet]) },
  emerald: { morning: MORNING, evening: reverse([...DAY_TO_DUSK, ...DUSK_TO_NIGHT.emerald]) },
};

/** The flat page colour for the current sun altitude; `dusk` picks Maghrib's stone. */
export function skyColor(altitude: number, evening: boolean, dusk: DuskStone = 'garnet'): string {
  const stops = evening ? PALETTES[dusk].evening : PALETTES[dusk].morning;
  let i = 0;
  while (i < stops.length - 2 && altitude > stops[i + 1].alt) i++;
  const a = stops[i];
  const b = stops[i + 1];
  const t = Math.min(1, Math.max(0, (altitude - a.alt) / (b.alt - a.alt)));
  return mixHex(a.color, b.color, t);
}

/** A few stops of a sun-following palette through one day, for the theme picker's swatches. */
export function daySwatches(dusk: DuskStone): string[] {
  return [
    skyColor(-12, false, dusk),
    skyColor(-3, false, dusk),
    skyColor(2, false, dusk),
    skyColor(30, false, dusk),
    skyColor(11, true, dusk),
    skyColor(4, true, dusk),
    skyColor(-2, true, dusk),
    skyColor(-9, true, dusk),
  ];
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
