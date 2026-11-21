import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { DIVINE_NAMES, TRANSLATIONS_APPROVED, type DivineName } from '@/data/divine-names';
import { CONTENT_LOCALE, LOCALE, t } from '@/lib/i18n';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const num = (n: number) => (LOCALE === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n));

/** The day's index into the 99 cards: the UTC day number modulo 99, the same rule as the website. */
export const todayNameIndex = () => Math.floor(Date.now() / 86_400_000) % DIVINE_NAMES.length;

/** A long phrase gets a smaller size, so even the 8-name verse fits on a few lines. */
export const nameSize = (arabic: string, base = 54) => (arabic.length <= 14 ? base : arabic.length <= 30 ? base * 0.74 : base * 0.56);

/**
 * One of the 99 names of God per day, from the cards of alhosna.net (Amin Sabry): Arabic, and the meaning
 * under it. Today's card comes first; a swipe brings the next cards in the order of the list, all 99 round,
 * and the number in the label follows. Once away from today, "Back to today" returns. "All 99 names" opens
 * the whole mosaic. English and German meanings are drafts until approved (`TRANSLATIONS_APPROVED`).
 */
export function NameOfDay({ n: chapter }: { n?: number } = {}) {
  const { colors } = usePhase();
  const today = todayNameIndex();
  // The list rotated so that today's card is the first page.
  const order = useMemo(() => DIVINE_NAMES.map((_, i) => (today + i) % DIVINE_NAMES.length), [today]);

  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  // `any`, as in screen.tsx: RN 0.88's ScrollView ref type is not the component type.
  const pager = useRef<any>(null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.min(order.length - 1, Math.max(0, Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))));
  };
  const index = order[page];
  // Each card's own height, so the section is as tall as the card in view (the 8-name verse is far taller).
  const [heights, setHeights] = useState<Record<number, number>>({});
  const height = heights[index];

  return (
    <View>
      {/* Away from today the label keeps only the number, so it never calls another card "of the day". */}
      <SectionLabel n={chapter}>{page === 0 ? `${t.nameOfDay} · ${t.nameOfN(num(index + 1))}` : t.nameOfN(num(index + 1))}</SectionLabel>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={32}
            style={height ? { height } : undefined}
            contentContainerStyle={styles.pages}>
            {order.map((i) => (
              <View
                key={i}
                style={[styles.page, { width }]}
                onLayout={(e) => {
                  const h = Math.ceil(e.nativeEvent.layout.height);
                  setHeights((m) => (m[i] === h ? m : { ...m, [i]: h }));
                }}>
                <NamePage name={DIVINE_NAMES[i]} />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
      {!TRANSLATIONS_APPROVED && CONTENT_LOCALE !== 'ar' ? (
        <Text style={[styles.draft, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.namesDraft}</Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/names')} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
          <Text style={[styles.moreText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>{t.namesAll} →</Text>
        </Pressable>
        {page > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => pager.current?.scrollTo({ x: 0, animated: true })}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
            <Text style={[styles.todayText, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.namesBackToday}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.todayText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.duaSwipe}</Text>
        )}
      </View>
    </View>
  );
}

function NamePage({ name }: { name: DivineName }) {
  const { colors } = usePhase();
  const meaning = CONTENT_LOCALE === 'ar' ? null : name[CONTENT_LOCALE];
  const size = nameSize(name.arabic);
  return (
    <View accessible accessibilityLabel={`${name.arabic}${meaning ? `, ${meaning}` : ''}`}>
      <Text style={[styles.arabic, { color: colors.text, fontFamily: Fonts.arabic, fontSize: size, lineHeight: size * 1.7 }]}>{name.arabic}</Text>
      {meaning ? <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pages keep their own height (not stretched to the tallest); the pager takes the height of the one in view.
  pages: { alignItems: 'flex-start' },
  page: { paddingHorizontal: 8 },
  arabic: { textAlign: 'center', marginTop: 6 },
  meaning: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 2 },
  draft: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8, opacity: 0.7 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  more: { paddingVertical: 12 },
  moreText: { fontSize: 15 },
  todayText: { fontSize: 13 },
  pressed: { opacity: 0.6 },
});
