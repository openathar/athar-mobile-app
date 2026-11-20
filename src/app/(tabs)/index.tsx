import { gregorianToHijri, formatLocalTime } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Anywhere } from '@/components/anywhere';
import { BigMoon } from '@/components/celestial';
import { NameOfDay } from '@/components/name-of-day';
import { DuaNow } from '@/components/dua-now';
import { PrayerPair } from '@/components/prayer-now';
import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { TwoBooks } from '@/components/two-books';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useLocation } from '@/hooks/use-location';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { useNow } from '@/hooks/use-now';
import { PRAYER_ORDER, getNextPrayer } from '@/hooks/use-prayer';
import { CONTENT_LOCALE, LOCALE, t } from '@/lib/i18n';
import { prayerName } from '@/lib/prayer-names';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (value: number) => String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

export default function PrayerScreen() {
  const now = useNow(1000);
  const { location } = useLocation();
  const { colors, times } = usePhase();
  const width = useScreenWidth();
  // The moon is the hero, but it must leave the header room to breathe.
  const heroSize = Math.min(width - 170, 220);
  const offsetHours = -now.getTimezoneOffset() / 60;
  const next = getNextPrayer(now, times);

  const dayKey = now.toDateString();
  const header = useMemo(() => {
    // One script per header: Arabic in the Arabic UI, the UI language's month names otherwise.
    const hijri = gregorianToHijri(now, LOCALE === 'ar' ? 'ar' : CONTENT_LOCALE);
    const gregorianRaw = now.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    // Hermes prints Latin digits for Arabic; the Hijri date next to it uses Arabic-Indic ones.
    const gregorian = LOCALE === 'ar' ? gregorianRaw.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : gregorianRaw;
    return {
      hijri:
        LOCALE === 'ar'
          ? `${toArabicDigits(hijri.day)} ${hijri.monthName} ${toArabicDigits(hijri.year)}`
          : LOCALE === 'de'
            ? `${hijri.day}. ${hijri.monthName} ${hijri.year} n. H.`
            : `${hijri.day} ${hijri.monthName} ${hijri.year} AH`,
      gregorian,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return (
    <Screen>
      <ScreenHeader
        titleAr={LOCALE === 'ar' ? header.hijri : undefined}
        titleAccent={LOCALE === 'ar' ? undefined : header.hijri}
        subtitle={`${header.gregorian} · ${location.label}`}
        celestial={false}
        style={styles.header}
      />

      {/* Tonight's real moon — the phase computed on the device */}
      <View style={styles.stage}>
        <BigMoon size={heroSize} draggable />
      </View>

      {/* Now ← · → next: the current prayer fades, the next one brightens. Tap the current one for details. */}
      <PrayerPair now={now} times={times} />

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
  // Lower than the other screens' headers, with room before the moon.
  header: {
    marginTop: 16,
    marginBottom: 28,
  },
  stage: {
    alignItems: 'center',
    marginHorizontal: -8,
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
