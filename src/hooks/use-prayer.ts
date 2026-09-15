import { Methods, PrayerTimes, type PrayerTimesResult } from '@openathar/athan-core-ts';

import type { DayPhase } from '@/constants/theme';

export const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_ORDER)[number];

const DAY_MS = 86_400_000;

export function getTodayTimes(now: Date, lat: number, lng: number): PrayerTimesResult {
  return new PrayerTimes(Methods.MWL).getTimes(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    lat,
    lng,
  );
}

/** The religious day phase for a given moment, based on today's prayer times. */
export function getDayPhase(now: Date, times: PrayerTimesResult): DayPhase {
  const current = now.getTime();
  if (current < times.fajr || current >= times.isha) return 'isha';
  if (current < times.sunrise) return 'fajr';
  if (current < times.dhuhr) return 'sunrise';
  if (current < times.asr) return 'dhuhr';
  if (current < times.maghrib) return 'asr';
  return 'maghrib';
}

export type NextPrayer = {
  key: PrayerKey;
  /** UTC epoch millis of the next prayer. */
  at: number;
};

/** The next upcoming prayer; after Isha this rolls over to tomorrow's Fajr. */
export function getNextPrayer(now: Date, times: PrayerTimesResult): NextPrayer {
  const current = now.getTime();
  for (const key of PRAYER_ORDER) {
    if (current < times[key]) return { key, at: times[key] };
  }
  return { key: 'fajr', at: times.fajr + DAY_MS };
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}