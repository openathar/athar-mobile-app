import { gregorianToHijri } from '@openathar/athan-core-ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { DUAS, type Collection, type Dua } from '@/data/duas';
import { pickDuas } from '@/lib/dua-pick';
import { LOCALE, t } from '@/lib/i18n';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const num = (n: string | number) => (LOCALE === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n));

/** Hadith grades in Arabic, where the UI is Arabic; elsewhere the transliterated term is the usual one. */
const GRADE_AR: Record<string, string> = { Sahih: 'صحيح', Hasan: 'حسن', 'Hasan Sahih': 'حسن صحيح' };
const gradeLabel = (g: string) => (LOCALE === 'ar' ? (GRADE_AR[g] ?? g) : g);

const collectionName = (c: Collection) =>
  ({ bukhari: t.colBukhari, muslim: t.colMuslim, abudawud: t.colAbudawud, tirmidhi: t.colTirmidhi, ibnmajah: t.colIbnmajah })[c];

const phaseTitle = (phase: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') =>
  ({ fajr: t.duaFajr, sunrise: t.duaSunrise, dhuhr: t.duaDhuhr, asr: t.duaAsr, maghrib: t.duaMaghrib, isha: t.duaIsha })[phase];

const FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/**
 * The du'a for this moment, and more a swipe away (lib/dua-pick.ts):
 * right after a prayer what the Prophet ﷺ said on finishing it, then what the Hijri date asks for
 * (Arafah, Ramadan, the new crescent), then the du'a of this part of the day. All bundled, offline;
 * the Arabic is quoted word for word from the hadith collections, with its source.
 * No counter — where the hadith gives a number, it is shown.
 */
export function DuaNow({ n }: { n?: number } = {}) {
  const { colors, phase, now, times } = usePhase();
  const nowMs = now.getTime();
  const hijri = gregorianToHijri(now, 'en');
  const last = FIVE.map((k) => times[k]).filter((at) => at <= nowMs).pop();
  const sincePrayer = last === undefined ? null : (nowMs - last) / 60_000;

  const keys = pickDuas({ phase, hijri: { month: hijri.month, day: hijri.day }, sincePrayer });
  const listKey = keys.join(',');
  const duas = useMemo(() => listKey.split(',').map((k) => DUAS[k]), [listKey]);

  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // `any`, as in screen.tsx: RN 0.88's ScrollView ref type is not the component type.
  const pager = useRef<any>(null);
  // A new suggestion list (new prayer period, prayer just began) starts at its first du'a.
  useEffect(() => {
    setIndex(0);
    pager.current?.scrollTo({ x: 0, animated: false });
  }, [listKey]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.min(duas.length - 1, Math.max(0, Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))));
  };

  return (
    <View>
      <SectionLabel n={n}>{phaseTitle(phase)}</SectionLabel>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onEnd}
            scrollEventThrottle={32}
            accessibilityHint={t.duaSwipe}>
            {duas.map((d) => (
              <View key={d.key} style={{ width }}>
                <DuaPage dua={d} />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {duas.length > 1 ? (
        <View style={styles.dotsRow} accessibilityLabel={t.duaOf.replace('{i}', num(index + 1)).replace('{n}', num(duas.length))}>
          <View style={styles.dots}>
            {duas.map((d, i) => (
              <View
                key={d.key}
                style={[styles.dot, { backgroundColor: i === index ? colors.accent : colors.rule, width: i === index ? 16 : 6 }]}
              />
            ))}
          </View>
          <Text style={[styles.swipe, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.duaSwipe}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DuaPage({ dua }: { dua: Dua }) {
  const { colors } = usePhase();
  const meaning = LOCALE === 'ar' ? null : dua.meaning[LOCALE];
  return (
    <View style={styles.page}>
      <Text style={[styles.occasion, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{dua.occasion[LOCALE]}</Text>
      <Text style={[styles.arabic, { color: colors.text, fontFamily: Fonts.arabic }]}>{dua.arabic}</Text>
      {meaning ? <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text> : null}
      {dua.count ? (
        <View style={[styles.repeat, { borderColor: colors.accent }]}>
          <Text style={[styles.repeatText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>
            {t.duaRepeat.replace('{n}', num(dua.count))}
          </Text>
        </View>
      ) : null}
      {/* JetBrains Mono has no Arabic glyphs: the Arabic source line uses the text face. */}
      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: LOCALE === 'ar' ? Fonts.sans : Fonts.mono }]}>
        {collectionName(dua.collection)} {num(dua.number)}
        {dua.grade && !['bukhari', 'muslim'].includes(dua.collection) ? ` · ${gradeLabel(dua.grade)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 10, paddingVertical: 2, paddingEnd: 4 },
  occasion: { fontSize: 13 },
  arabic: { fontSize: 25, lineHeight: 46, textAlign: 'center', writingDirection: 'rtl' },
  meaning: { fontSize: 14, lineHeight: 21 },
  repeat: { alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  repeatText: { fontSize: 12 },
  source: { fontSize: 11 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
  swipe: { fontSize: 12 },
});
