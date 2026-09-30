import { gregorianToHijri, formatLocalTime, moonPhaseAt } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Falak } from '@/components/falak';
import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useLocation } from '@/hooks/use-location';
import { useNow } from '@/hooks/use-now';
import { PRAYER_ORDER, formatCountdown, getNextPrayer } from '@/hooks/use-prayer';

const PRAYER_NAMES: Record<(typeof PRAYER_ORDER)[number], { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

const MOON_NAMES: Record<string, string> = {
  new: 'New moon',
  'waxing-crescent': 'Waxing crescent',
  'first-quarter': 'First quarter',
  'waxing-gibbous': 'Waxing gibbous',
  full: 'Full moon',
  'waning-gibbous': 'Waning gibbous',
  'last-quarter': 'Last quarter',
  'waning-crescent': 'Waning crescent',
};

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (value: number) => String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

export default function PrayerScreen() {
  const now = useNow(1000);
  const { location } = useLocation();
  const { colors, times } = usePhase();
  const { width } = useWindowDimensions();
  // Clamped at 0 because the first layout pass reports width 0 on web.
  const sphereSize = Math.max(0, Math.min(width - 24, 420));
  const minuteMs = Math.floor(now.getTime() / 60000) * 60000;
  const offsetHours = -now.getTimezoneOffset() / 60;
  const next = getNextPrayer(now, times);
  const nextName = PRAYER_NAMES[next.key];

  const dayKey = now.toDateString();
  const header = useMemo(() => {
    const hijri = gregorianToHijri(now, 'ar');
    const gregorian = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const moon = moonPhaseAt(now);
    return {
      hijri: `${toArabicDigits(hijri.day)} ${hijri.monthName} ${toArabicDigits(hijri.year)}`,
      gregorian,
      moon: `${MOON_NAMES[moon.key] ?? moon.key} · ${Math.round(moon.illumination * 100)}%`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return (
    <Screen>
      <ScreenHeader titleAr={header.hijri} subtitle={`${header.gregorian} · ${location.label}`} />

      {/* The sky itself — today's sun path over this place */}
      <View style={styles.stage}>
        <Falak
          size={sphereSize}
          minuteMs={minuteMs}
          times={times}
          lat={location.lat}
          lng={location.lng}
          nextKey={next.key}
          colors={colors}
        />
      </View>

      <View style={styles.next}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
          next prayer
        </Text>
        <View style={styles.nameRow}>
          <Text style={[styles.prayerName, { color: colors.text, fontFamily: Fonts.display }]}>{nextName.en}</Text>
          <Text style={[styles.prayerNameAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>{nextName.ar}</Text>
        </View>
        <Text style={[styles.countdown, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
          {formatCountdown(next.at - now.getTime())}
        </Text>
        <Text style={[styles.at, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
          at {formatLocalTime(next.at, offsetHours)}
        </Text>
      </View>

      <SectionLabel>today</SectionLabel>
      <Card>
        {PRAYER_ORDER.map((key, i) => {
          const isNext = key === next.key;
          const passed = times[key] <= now.getTime();
          return (
            <View key={key}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <View style={styles.rowLead}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isNext ? colors.accent : passed ? colors.rule : colors.textSecondary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.rowName,
                      {
                        color: isNext ? colors.accent : passed ? colors.textSecondary : colors.text,
                        fontFamily: isNext ? Fonts.sansSemiBold : Fonts.sansMedium,
                      },
                    ]}>
                    {PRAYER_NAMES[key].en}
                  </Text>
                  <Text style={[styles.rowNameAr, { color: colors.textSecondary, fontFamily: Fonts.arabic }]}>
                    {PRAYER_NAMES[key].ar}
                  </Text>
                </View>
                <Text
                  style={[styles.rowTime, { color: isNext ? colors.accent : colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {formatLocalTime(times[key], offsetHours)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={[styles.moonCaption, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{header.moon}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  next: {
    alignItems: 'center',
    marginTop: -6,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 2,
  },
  prayerName: {
    fontSize: 40,
    lineHeight: 48,
  },
  prayerNameAr: {
    fontSize: 30,
    lineHeight: 44,
  },
  countdown: {
    fontSize: 50,
    lineHeight: 60,
    letterSpacing: 2,
  },
  at: {
    fontSize: 13,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rowLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowName: {
    fontSize: 16,
  },
  rowNameAr: {
    fontSize: 15,
  },
  rowTime: {
    fontSize: 16,
  },
  moonCaption: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 14,
  },
});
