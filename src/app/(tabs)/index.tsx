import { gregorianToHijri, formatLocalTime } from '@openathar/athan-core-ts';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Falak } from '@/components/falak';
import { Moon, moonCaption } from '@/components/moon';
import { StarField } from '@/components/star-field';
import { Fonts, PhaseColors, type DayPhase } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { useNow } from '@/hooks/use-now';
import {
  PRAYER_ORDER,
  formatCountdown,
  getDayPhase,
  getNextPrayer,
  getTodayTimes,
} from '@/hooks/use-prayer';

const PRAYER_NAMES: Record<(typeof PRAYER_ORDER)[number], { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (value: number) => String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

export default function PrayerScreen() {
  const now = useNow(1000);
  const { location } = useLocation();
  const { width } = useWindowDimensions();
  // Clamped at 0 because the first layout pass reports width 0 on web.
  const sphereSize = Math.max(0, Math.min(width - 24, 420));

  // Prayer times only change with the day or the place — recomputing them
  // every second would also hand the sphere a new object every tick and
  // defeat its memoisation.
  const dayKey = now.toDateString();
  const times = useMemo(
    () => getTodayTimes(now, location.lat, location.lng),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, location.lat, location.lng]
  );
  const minuteMs = Math.floor(now.getTime() / 60000) * 60000;

  const palette = useMemo(() => {
    const offsetHours = -now.getTimezoneOffset() / 60;
    const phase = getDayPhase(now, times);
    const next = getNextPrayer(now, times);
    const hijri = gregorianToHijri(now, 'ar');
    return {
      phase,
      colors: PhaseColors[phase],
      offsetHours,
      next,
      hijri: `${toArabicDigits(hijri.day)} ${hijri.monthName} ${toArabicDigits(hijri.year)}`,
      gregorian: now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      moon: moonCaption(now),
    };
  }, [now, times]);

  // Crossfade beim Phasenwechsel: die alte Phase bleibt als Basis liegen,
  // die neue blendet darüber ein (wie ein Atemzug im Tagesrhythmus).
  const [displayedPhase, setDisplayedPhase] = useState<DayPhase>(palette.phase);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (palette.phase === displayedPhase) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => setDisplayedPhase(palette.phase));
  }, [palette.phase, displayedPhase, fade]);

  const { colors } = palette;
  const countdown = formatCountdown(palette.next.at - now.getTime());
  const nextName = PRAYER_NAMES[palette.next.key];

  return (
    <View style={styles.container}>
      <LinearGradient colors={PhaseColors[displayedPhase].gradient} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.container, { opacity: fade }]}>
        <LinearGradient colors={palette.colors.gradient} style={styles.container}>
          <StarField colors={colors.stars} />

          <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {/* Header — Hijri date leads, Gregorian and place follow quietly */}
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={[styles.hijri, { color: colors.accent, fontFamily: Fonts.arabicBold }]}>
                    {palette.hijri}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                    {palette.gregorian} · {location.label}
                  </Text>
                </View>
                <Moon
                  size={34}
                  now={now}
                  lit={colors.moon.lit}
                  dark={colors.moon.dark}
                  glow={colors.moon.glow}
                  maria={colors.moon.maria}
                />
              </View>

              {/* The sky itself — today's sun path over this place */}
              <View style={styles.stage}>
                <Falak
                  size={sphereSize}
                  minuteMs={minuteMs}
                  times={times}
                  lat={location.lat}
                  lng={location.lng}
                  nextKey={palette.next.key}
                  colors={colors}
                />
              </View>

              {/* Next prayer */}
              <View style={styles.next}>
                <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  NEXT PRAYER
                </Text>
                <View style={styles.nameRow}>
                  <Text style={[styles.prayerName, { color: colors.text, fontFamily: Fonts.display }]}>
                    {nextName.en}
                  </Text>
                  <Text style={[styles.prayerNameAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
                    {nextName.ar}
                  </Text>
                </View>
                <Text style={[styles.countdown, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
                  {countdown}
                </Text>
                <Text style={[styles.at, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  at {formatLocalTime(palette.next.at, palette.offsetHours)}
                </Text>
              </View>

              {/* Today's times */}
              <View style={[styles.list, { backgroundColor: colors.surface }]}>
                {PRAYER_ORDER.map((key, i) => {
                  const isNext = key === palette.next.key;
                  const passed = times[key] <= now.getTime();
                  return (
                    <View
                      key={key}
                      style={[
                        styles.row,
                        i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
                      ]}>
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
                        style={[
                          styles.rowTime,
                          { color: isNext ? colors.accent : colors.textSecondary, fontFamily: Fonts.mono },
                        ]}>
                        {formatLocalTime(times[key], palette.offsetHours)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.moonCaption, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                {palette.moon}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 2,
  },
  hijri: {
    fontSize: 24,
    lineHeight: 34,
  },
  meta: {
    fontSize: 13,
  },
  stage: {
    alignItems: 'center',
    marginHorizontal: -8,
    marginTop: 4,
  },
  next: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 4,
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
  list: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 4,
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
