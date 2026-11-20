import { gregorianToHijri, formatLocalTime } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Anywhere } from '@/components/anywhere';
import { BigMoon } from '@/components/celestial';
import { NameOfDay } from '@/components/name-of-day';
import { DuaNow } from '@/components/dua-now';
import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { TwoBooks } from '@/components/two-books';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useLocation } from '@/hooks/use-location';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { useNow } from '@/hooks/use-now';
import { PRAYER_ORDER, formatCountdown, getNextPrayer } from '@/hooks/use-prayer';
import { LOCALE, PRAYER_KEYS, t } from '@/lib/i18n';

const ARABIC_NAMES: Record<(typeof PRAYER_ORDER)[number], string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

/** Latin name in the device language plus its Arabic twin (the Arabic UI shows the Arabic name once). */
const prayerName = (key: (typeof PRAYER_ORDER)[number]) => ({
  primary: t[PRAYER_KEYS[key]],
  twin: LOCALE === 'ar' ? null : ARABIC_NAMES[key],
});

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (value: number) => String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

export default function PrayerScreen() {
  const now = useNow(1000);
  const { location } = useLocation();
  const { colors, times } = usePhase();
  const width = useScreenWidth();
  // The moon is the hero, but it must leave the header room to breathe.
  const heroSize = Math.min(width - 110, 290);
  const minuteMs = Math.floor(now.getTime() / 60000) * 60000;
  const offsetHours = -now.getTimezoneOffset() / 60;
  const next = getNextPrayer(now, times);
  const nextName = prayerName(next.key);

  const dayKey = now.toDateString();
  const header = useMemo(() => {
    const hijri = gregorianToHijri(now, 'ar');
    const gregorianRaw = now.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    // Hermes prints Latin digits for Arabic; the Hijri date next to it uses Arabic-Indic ones.
    const gregorian = LOCALE === 'ar' ? gregorianRaw.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : gregorianRaw;
    return {
      hijri: `${toArabicDigits(hijri.day)} ${hijri.monthName} ${toArabicDigits(hijri.year)}`,
      gregorian,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return (
    <Screen>
      <ScreenHeader titleAr={header.hijri} subtitle={`${header.gregorian} · ${location.label}`} celestial={false} />

      {/* Tonight's real moon — the phase computed on the device */}
      <View style={styles.stage}>
        <BigMoon size={heroSize} />
      </View>

      <View style={styles.next}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.nextPrayer}</Text>
        <View style={styles.nameRow}>
          <Text style={[styles.prayerName, { color: colors.text, fontFamily: Fonts.display }]}>{nextName.primary}</Text>
          {nextName.twin ? (
            <Text style={[styles.prayerNameAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>{nextName.twin}</Text>
          ) : null}
        </View>
        <Text style={[styles.countdown, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
          {formatCountdown(next.at - now.getTime())}
        </Text>
        <Text style={[styles.at, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          {t.at} {formatLocalTime(next.at, offsetHours)}
        </Text>
      </View>

      {/* The verse the name comes from — as under the website's hero. */}
      <View style={[styles.ayah, { borderColor: colors.rule }]}>
        <Text style={[styles.ayahAr, { color: colors.text, fontFamily: Fonts.arabic }]}>وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ</Text>
        {LOCALE !== 'ar' ? <Text style={[styles.ayahTr, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.ayahAthar}</Text> : null}
        <Text style={[styles.ayahRef, { color: colors.accent, fontFamily: Fonts.mono }]}>{t.ayahAtharRef}</Text>
      </View>

      <SectionLabel n={1}>{t.today}</SectionLabel>
      <Card>
        {PRAYER_ORDER.map((key, i) => {
          const isNext = key === next.key;
          const passed = times[key] <= now.getTime();
          const tone = isNext ? colors.accent : passed ? colors.textSecondary : colors.text;
          return (
            <View key={key}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <View style={styles.rowLead}>
                  <Text style={[styles.rowName, { color: tone, fontFamily: isNext ? Fonts.sansSemiBold : Fonts.sansMedium }]}>
                    {prayerName(key).primary}
                  </Text>
                  {prayerName(key).twin ? (
                    <Text style={[styles.rowNameAr, { color: colors.textSecondary, fontFamily: Fonts.arabic }]}>
                      {prayerName(key).twin}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.rowTime, { color: tone, fontFamily: Fonts.mono }]}>
                  {formatLocalTime(times[key], offsetHours)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <DuaNow n={2} />
      <NameOfDay n={3} />
      <Anywhere n={4} />
      <TwoBooks n={5} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  // Left-aligned, like the landing page's hero: the name set large and light,
  // the live countdown beneath it.
  next: {
    marginTop: 4,
    gap: 2,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 14,
    marginTop: 4,
  },
  prayerName: {
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.5,
  },
  prayerNameAr: {
    fontSize: 34,
    lineHeight: 50,
  },
  countdown: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 1,
  },
  at: {
    fontSize: 15,
  },
  ayah: {
    marginTop: 36,
    paddingVertical: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  ayahAr: {
    fontSize: 28,
    lineHeight: 50,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  ayahTr: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  ayahRef: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 15,
  },
  rowLead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  rowName: {
    fontSize: 18,
  },
  rowNameAr: {
    fontSize: 16,
  },
  rowTime: {
    fontSize: 18,
  },
});
