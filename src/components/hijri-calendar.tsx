import { gregorianToHijri, hijriMonthNames, hijriToGregorian } from '@openathar/athan-core-ts';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { CONTENT_LOCALE, LOCALE, t } from '@/lib/i18n';

const DAY_MS = 86_400_000;
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const num = (n: number) => (LOCALE === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n));

type Cell = { hijri: number; greg: Date } | null;

/** One Hijri month as a week grid (Monday first), computed on the device. */
function buildMonth(year: number, month: number): { cells: Cell[]; length: number } {
  const first = hijriToGregorian(year, month, 1, 'en');
  if (!first) return { cells: [], length: 0 };
  const days: { hijri: number; greg: Date }[] = [];
  for (let i = 0; i < 30; i++) {
    const greg = new Date(first.getTime() + i * DAY_MS);
    const h = gregorianToHijri(greg, 'en');
    if (h.month !== month) break;
    days.push({ hijri: h.day, greg });
  }
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: Cell[] = [...Array<Cell>(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  return { cells, length: days.length };
}

/**
 * The Hijri month — computed on the device (Umm al-Qura via ICU), so it needs no
 * connection and nothing to sync. The coming observances are announced by the
 * Fanous (`components/fanous.tsx`) on the same screen.
 */
export function HijriCalendar() {
  const { colors, now } = usePhase();
  const todayH = useMemo(() => gregorianToHijri(now, 'en'), [now.toDateString()]);
  const [offset, setOffset] = useState(0);
  const view = useMemo(() => {
    const idx = todayH.year * 12 + (todayH.month - 1) + offset;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
  }, [todayH, offset]);
  const month = useMemo(() => buildMonth(view.year, view.month), [view]);
  const names = hijriMonthNames(CONTENT_LOCALE);
  const weekdays = useMemo(() => {
    const base = new Date(Date.UTC(2024, 0, 1)); // a Monday
    return Array.from({ length: 7 }, (_, i) => new Date(base.getTime() + i * DAY_MS).toLocaleDateString(LOCALE, { weekday: 'narrow', timeZone: 'UTC' }));
  }, []);
  const isCurrent = view.year === todayH.year && view.month === todayH.month;

  return (
    <View>
      <SectionLabel>{t.calendarTitle}</SectionLabel>
      <View style={styles.head}>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={14} accessibilityRole="button">
          <Text style={[styles.step, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>‹</Text>
        </Pressable>
        <Text style={[styles.month, { color: colors.accent, fontFamily: Fonts.arabic }]}>
          {names[view.month - 1]} {num(view.year)}
        </Text>
        <Pressable onPress={() => setOffset((o) => o + 1)} hitSlop={14} accessibilityRole="button">
          <Text style={[styles.step, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {weekdays.map((w, i) => (
          <Text key={i} style={[styles.cell, styles.wd, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
            {w}
          </Text>
        ))}
        {month.cells.map((c, i) => {
          const isToday = !!c && isCurrent && c.hijri === todayH.day;
          return (
            <View key={i} style={styles.cell}>
              {c && (
                <View style={[styles.dayWrap, isToday && { backgroundColor: colors.accent }]}>
                  <Text style={[styles.day, { color: isToday ? colors.onAccent : colors.text, fontFamily: Fonts.sansMedium }]}>{num(c.hijri)}</Text>
                  <Text style={[styles.greg, { color: isToday ? colors.onAccent : colors.textSecondary, fontFamily: Fonts.mono }]}>{c.greg.getUTCDate()}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  step: { fontSize: 28, paddingHorizontal: 8 },
  month: { fontSize: 28, lineHeight: 42 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  wd: { fontSize: 12, paddingBottom: 4 },
  dayWrap: { width: 40, height: 46, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 16 },
  greg: { fontSize: 10 },
});
