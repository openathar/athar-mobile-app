import type { DayPhase } from '@/constants/theme';
import { DUA_AFTER_PRAYER, DUAS, DUAS_BY_PHASE, DUAS_SPECIAL, type DuaRule } from '@/data/duas';

/** Minutes after a prayer time in which the du'a for finishing a prayer comes first. */
export const AFTER_PRAYER_MINUTES = 30;

export type DuaMoment = {
  /** The part of the day (the current prayer period). */
  phase: DayPhase;
  /** Today's Hijri month (1–12) and day (1–30), Umm al-Qura. */
  hijri: { month: number; day: number };
  /** Minutes since the last of the five prayer times began; null when none has today. */
  sincePrayer: number | null;
};

const fits = (r: DuaRule, m: DuaMoment) =>
  (!r.months || r.months.includes(m.hijri.month)) &&
  (!r.days || (m.hijri.day >= r.days[0] && m.hijri.day <= r.days[1])) &&
  (!r.phases || r.phases.includes(m.phase));

/**
 * The du'a to suggest now, in order — the first one is shown, the rest are a swipe away:
 * 1. Right after a prayer: what the Prophet ﷺ said when he finished it.
 * 2. What the Hijri date asks for (Arafah, Ramadan's iftar and last ten nights, the new crescent).
 * 3. The du'a of this part of the day.
 * Each key appears once, in its first place.
 */
export function pickDuas(m: DuaMoment): string[] {
  const out: string[] = [];
  const add = (key: string) => {
    if (DUAS[key] && !out.includes(key)) out.push(key);
  };
  if (m.sincePrayer !== null && m.sincePrayer >= 0 && m.sincePrayer < AFTER_PRAYER_MINUTES && m.phase !== 'sunrise') {
    add(DUA_AFTER_PRAYER);
  }
  for (const r of DUAS_SPECIAL) if (fits(r, m)) add(r.key);
  for (const key of DUAS_BY_PHASE[m.phase]) add(key);
  return out;
}
