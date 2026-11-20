import type { PrayerTimesResult } from '@openathar/athan-core-ts';

import type { PrayerKey } from '@/hooks/use-prayer';

const DAY_MS = 86_400_000;

export type ObligatoryKey = Exclude<PrayerKey, 'sunrise'>;

/**
 * What the present moment is for, and how long it lasts — the windows of the hadith of Abdullah
 * ibn Amr (Sahih Muslim 612):
 * - Fajr from dawn until sunrise.
 * - Dhuhr from noon until Asr.
 * - Asr until the sun sets (best while it is still bright, not yellow).
 * - Maghrib until the twilight is gone, which is when Isha begins.
 * - Isha until the middle of the night.
 * Between them: Duha in the forenoon, the night prayer from the middle of the night until Fajr
 * (best in its last third, Sahih al-Bukhari 1145), and two short pauses when no prayer is
 * prayed — while the sun rises and just before noon (Sahih Muslim 831).
 *
 * Every boundary comes from the calculation core (`@openathar/athan-core-ts`): `midnight` (per the
 * method's convention), `duhaStart` (sunrise + 15 min) and `duhaEnd` (noon − 10 min). Only the
 * last third is reckoned here, from Maghrib to the next Fajr, because the core has no field for it.
 * Before today's Fajr, yesterday's values are taken as today's minus a day — a minute or two off.
 */
export type PrayerWindow =
  | { kind: 'prayer'; key: ObligatoryKey; start: number; end: number; endsAt: 'sunrise' | 'asr' | 'maghrib' | 'isha' | 'midnight' }
  | { kind: 'duha'; start: number; end: number; endsAt: 'dhuhr' }
  | { kind: 'pause'; start: number; end: number; endsAt: 'duha' | 'dhuhr' }
  | { kind: 'night'; start: number; end: number; endsAt: 'fajr'; lastThird: number };

export type DayTimes = Pick<PrayerTimesResult, PrayerKey | 'midnight' | 'duhaStart' | 'duhaEnd'>;

export function currentWindow(now: number, t: DayTimes): PrayerWindow {
  if (now < t.fajr) {
    return nightOrIsha(now, t.maghrib - DAY_MS, t.isha - DAY_MS, nightMiddle(t) - DAY_MS, t.fajr);
  }
  if (now < t.sunrise) return { kind: 'prayer', key: 'fajr', start: t.fajr, end: t.sunrise, endsAt: 'sunrise' };
  if (now < t.duhaStart) return { kind: 'pause', start: t.sunrise, end: t.duhaStart, endsAt: 'duha' };
  if (now < t.duhaEnd) return { kind: 'duha', start: t.duhaStart, end: t.duhaEnd, endsAt: 'dhuhr' };
  if (now < t.dhuhr) return { kind: 'pause', start: t.duhaEnd, end: t.dhuhr, endsAt: 'dhuhr' };
  if (now < t.asr) return { kind: 'prayer', key: 'dhuhr', start: t.dhuhr, end: t.asr, endsAt: 'asr' };
  if (now < t.maghrib) return { kind: 'prayer', key: 'asr', start: t.asr, end: t.maghrib, endsAt: 'maghrib' };
  if (now < t.isha) return { kind: 'prayer', key: 'maghrib', start: t.maghrib, end: t.isha, endsAt: 'isha' };
  return nightOrIsha(now, t.maghrib, t.isha, nightMiddle(t), t.fajr + DAY_MS);
}

/** The core's midnight for the night after this day's Maghrib (it may come back as the same calendar day's early hours). */
function nightMiddle(t: DayTimes): number {
  return t.midnight < t.maghrib ? t.midnight + DAY_MS : t.midnight;
}

function nightOrIsha(now: number, maghrib: number, isha: number, midnight: number, fajr: number): PrayerWindow {
  if (now < midnight) return { kind: 'prayer', key: 'isha', start: isha, end: midnight, endsAt: 'midnight' };
  return { kind: 'night', start: midnight, end: fajr, endsAt: 'fajr', lastThird: maghrib + ((fajr - maghrib) * 2) / 3 };
}

/** "3 h 58 min", "42 min" — language-neutral units. */
export function formatSpan(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}
