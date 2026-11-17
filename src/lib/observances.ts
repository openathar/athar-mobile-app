import { gregorianToHijri, hijriToGregorian } from '@openathar/athan-core-ts';

import { OBSERVANCES } from '@/data/observances';
import { LOCALE } from '@/lib/i18n';

const DAY_MS = 86_400_000;

export type Upcoming = { key: string; name: string; note: string; days: number; greg: Date };

/** Next occurrence of each observance on or after today, soonest first. */
export function upcomingObservances(now: Date, count: number): Upcoming[] {
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const year = gregorianToHijri(today, 'en').year;
  const out: Upcoming[] = [];
  for (const o of OBSERVANCES) {
    for (const y of [year, year + 1]) {
      const greg = hijriToGregorian(y, o.month, o.day, 'en');
      if (greg && greg.getTime() >= today.getTime()) {
        out.push({ key: o.key, name: o.name[LOCALE], note: o.note[LOCALE], days: Math.round((greg.getTime() - today.getTime()) / DAY_MS), greg });
        break;
      }
    }
  }
  return out.sort((a, b) => a.days - b.days).slice(0, count);
}
