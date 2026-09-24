import { gregorianToHijri, formatLocalTime } from '@openathar/athan-core-ts';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Khatam } from '@/components/khatam';
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
  const palette = useMemo(() => {
    const times = getTodayTimes(now, location.lat, location.lng);
    const offsetHours = -now.getTimezoneOffset() / 60;
    const phase = getDayPhase(now, times);
    const next = getNextPrayer(now, times);
    const hijri = gregorianToHijri(now, 'ar');
    return {
      phase,
      colors: PhaseColors[phase],
      times,
      offsetHours,
      next,
      hijri: `${toArabicDigits(hijri.day)} ${hijri.monthName} ${toArabicDigits(hijri.year)}`,
      gregorian: now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      moon: moonCaption(now),
    };
  }, [now, location]);

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
          {/* Sternenhimmel wie der Web-Hero — flimmert hinter Khatam & Inhalt */}
          <StarField colors={colors.stars} />
          {/* Khatam-Signet wie auf openathar.org — langsam rotierend hinter dem Hero */}
          <View style={styles.khatamWrap}>
            <Khatam size={460} color={colors.accent} opacity={0.12} />
          </View>

          <SafeAreaView style={styles.safeArea}>
            {/* Heute am Himmel: der Mond in seiner echten Phase, atmender Glow */}
            <View style={styles.moonWrap} pointerEvents="none">
              <Moon
                size={46}
                now={now}
                lit={colors.moon.lit}
                dark={colors.moon.dark}
                glow={colors.moon.glow}
                maria={colors.moon.maria}
              />
            </View>

            {/* Header — Hijri date in Arabic calligraphy */}
            <View style={styles.header}>
              <Text style={[styles.hijri, { color: colors.accent, fontFamily: Fonts.arabicBold }]}>
                {palette.hijri}
              </Text>
              <Text style={[styles.gregorian, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                {palette.gregorian}
              </Text>
              <Text style={[styles.location, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                {location.label}
              </Text>
            </View>

            {/* Hero — next prayer + countdown */}
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
                NEXT PRAYER
              </Text>
              <Text style={[styles.prayerName, { color: colors.text, fontFamily: Fonts.display }]}>
                {nextName.en}
              </Text>
              <Text style={[styles.prayerNameAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
                {nextName.ar}
              </Text>
              <Text style={[styles.countdown, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
                {countdown}
              </Text>
              <Text style={[styles.at, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                at {formatLocalTime(palette.next.at, palette.offsetHours)}
              </Text>
            </View>

            {/* Today's times */}
            <View style={[styles.list, { backgroundColor: colors.surface }]}>
              {PRAYER_ORDER.map((key) => {
                const isNext = key === palette.next.key;
                return (
                  <View key={key} style={styles.row}>
                    <Text
                      style={[
                        styles.rowName,
                        { color: isNext ? colors.accent : colors.text, fontFamily: Fonts.sansMedium },
                      ]}>
                      {PRAYER_NAMES[key].en}
                    </Text>
                    <Text
                      style={[
                        styles.rowTime,
                        { color: isNext ? colors.accent : colors.textSecondary, fontFamily: Fonts.mono },
                      ]}>
                      {formatLocalTime(palette.times[key], palette.offsetHours)}
                    </Text>
                  </View>
                );
              })}
              {/* "Heute am Himmel" — Phase + Beleuchtung, wie TodaySky auf der Website */}
              <View style={[styles.moonRow, { borderTopColor: colors.rule }]}>
                <Text style={[styles.moonCaption, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {palette.moon}
                </Text>
              </View>
            </View>
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
  khatamWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  moonWrap: {
    position: 'absolute',
    top: 12,
    right: 4,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  hijri: {
    fontSize: 26,
    lineHeight: 34,
  },
  gregorian: {
    fontSize: 14,
  },
  location: {
    fontSize: 13,
    opacity: 0.8,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  prayerName: {
    fontSize: 44,
    lineHeight: 52,
  },
  prayerNameAr: {
    fontSize: 34,
    lineHeight: 44,
  },
  countdown: {
    fontSize: 64,
    lineHeight: 76,
    letterSpacing: 2,
    marginTop: 12,
  },
  at: {
    fontSize: 16,
  },
  list: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowName: {
    fontSize: 16,
  },
  rowTime: {
    fontSize: 16,
  },
  moonRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: 'center',
  },
  moonCaption: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});