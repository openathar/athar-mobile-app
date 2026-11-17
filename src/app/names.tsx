import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { nameSize, todayNameIndex } from '@/components/name-of-day';
import { ModalHeader, Screen } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { DIVINE_NAMES, TRANSLATIONS_APPROVED } from '@/data/divine-names';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { CONTENT_LOCALE, IS_RTL, LOCALE, t } from '@/lib/i18n';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const digits = (n: number) => (LOCALE === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n));
const COUNT = DIVINE_NAMES.length;

/**
 * All 99 cards as a mosaic, laid out like the PDF of alhosna.net: outlined cards flowing in Arabic reading
 * order (right to left, row after row), each as wide as its words need, the rows filled edge to edge. The
 * list is rotated so today's card comes first; tapping a card shows it large, with its meaning, and the
 * arrows step through the cycle.
 */
export default function NamesScreen() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const today = useMemo(todayNameIndex, []);
  const [selected, setSelected] = useState(today);
  const order = useMemo(() => Array.from({ length: COUNT }, (_, i) => (today + i) % COUNT), [today]);
  const name = DIVINE_NAMES[selected];
  const meaning = CONTENT_LOCALE === 'ar' ? null : name[CONTENT_LOCALE];
  const step = (d: 1 | -1) => setSelected((s) => (s + d + COUNT) % COUNT);
  const inner = width - 40;

  return (
    <Screen>
      <ModalHeader title={IS_RTL ? undefined : t.namesTitle} titleAr={IS_RTL ? t.namesTitle : 'أسماء الألوهية'} subtitle={t.namesSource} />

      <View style={[styles.viewer, { borderColor: colors.rule }]}>
        <Text style={[styles.counter, { color: colors.textSecondary, fontFamily: LOCALE === 'ar' ? Fonts.sans : Fonts.mono }]}>
          {selected === today ? `${t.namesToday} · ` : ''}
          {digits(selected + 1)} / {digits(COUNT)}
        </Text>
        <Animated.View key={selected} entering={FadeIn.duration(260)} style={styles.stage}>
          <Text style={[styles.arabic, { color: colors.text, fontFamily: Fonts.arabic, fontSize: nameSize(name.arabic, 46), lineHeight: nameSize(name.arabic, 46) * 1.7 }]}>{name.arabic}</Text>
          {meaning ? <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text> : null}
        </Animated.View>
        <View style={styles.arrows}>
          <Pressable accessibilityRole="button" accessibilityLabel={t.namesPrev} hitSlop={12} onPress={() => step(-1)} style={({ pressed }) => [styles.arrow, { borderColor: colors.rule }, pressed && styles.pressed]}>
            <Text style={[styles.arrowText, { color: colors.accent }]}>{IS_RTL ? '›' : '‹'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t.namesNext} hitSlop={12} onPress={() => step(1)} style={({ pressed }) => [styles.arrow, { borderColor: colors.rule }, pressed && styles.pressed]}>
            <Text style={[styles.arrowText, { color: colors.accent }]}>{IS_RTL ? '‹' : '›'}</Text>
          </Pressable>
        </View>
        {meaning && !TRANSLATIONS_APPROVED ? <Text style={[styles.draft, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.namesDraft}</Text> : null}
      </View>

      {/* Arabic reading order: the first card sits at the right, whatever the interface direction. */}
      <View style={[styles.mosaic, { flexDirection: IS_RTL ? 'row' : 'row-reverse' }]}>
        {order.map((idx) => {
          const card = DIVINE_NAMES[idx];
          const on = idx === selected;
          const isToday = idx === today;
          // Wider for more words; flexGrow then stretches each row to the edge.
          const basis = Math.min(inner, Math.max(92, card.arabic.length * 8.6 + 30));
          return (
            <Pressable
              key={idx}
              accessibilityRole="button"
              accessibilityLabel={card.arabic}
              accessibilityState={{ selected: on }}
              onPress={() => setSelected(idx)}
              style={({ pressed }) => [
                styles.card,
                { flexBasis: basis, borderColor: on ? colors.accent : colors.rule, backgroundColor: on ? colors.accent + '1f' : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.cardText, { color: on ? colors.accent : colors.text, fontFamily: Fonts.arabic }]}>{card.arabic}</Text>
              {isToday ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  viewer: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginTop: 4, marginBottom: 18 },
  counter: { fontSize: 12, textAlign: 'center' },
  stage: { minHeight: 150, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  arabic: { textAlign: 'center' },
  meaning: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 4 },
  draft: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 10, opacity: 0.8 },
  arrows: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  arrow: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 26, lineHeight: 28 },
  mosaic: { flexWrap: 'wrap', gap: 8, paddingBottom: 90 },
  card: { flexGrow: 1, minHeight: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  cardText: { fontSize: 19, lineHeight: 30, textAlign: 'center' },
  dot: { position: 'absolute', top: 6, left: 7, width: 5, height: 5, borderRadius: 3 },
  pressed: { opacity: 0.6 },
});
