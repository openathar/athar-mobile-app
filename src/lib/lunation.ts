import { moonPhaseAt } from '@openathar/athan-core-ts';

const SYNODIC = 29.530588853;

/** The eight classic phases as lunation fractions. */
export const FACES = [
  { key: 'new', fraction: 0 },
  { key: 'waxing-crescent', fraction: 0.125 },
  { key: 'first-quarter', fraction: 0.25 },
  { key: 'waxing-gibbous', fraction: 0.375 },
  { key: 'full', fraction: 0.5 },
  { key: 'waning-gibbous', fraction: 0.625 },
  { key: 'last-quarter', fraction: 0.75 },
  { key: 'waning-crescent', fraction: 0.875 },
] as const;

/** Days from `now` until the lunation reaches `fraction` (0..29.5; 0 if it is within half a day of it now). */
export function daysUntilFraction(now: Date, fraction: number): number {
  const age = moonPhaseAt(now).ageDays;
  let d = fraction * SYNODIC - age;
  if (d < -0.5) d += SYNODIC;
  return Math.max(0, Math.round(d));
}
