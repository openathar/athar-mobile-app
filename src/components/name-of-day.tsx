import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { DIVINE_NAMES, TRANSLATIONS_APPROVED } from '@/data/divine-names';
import { CONTENT_LOCALE, LOCALE, t } from '@/lib/i18n';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** The day's index into the 99 cards: the UTC day number modulo 99, the same rule as the website. */
export const todayNameIndex = () => Math.floor(Date.now() / 86_400_000) % DIVINE_NAMES.length;

/** A long phrase gets a smaller size, so even the 8-name verse fits on a few lines. */
export const nameSize = (arabic: string, base = 54) => (arabic.length <= 14 ? base : arabic.length <= 30 ? base * 0.74 : base * 0.56);

/**
 * One of the 99 names of God per day, from the cards of alhosna.net (Amin Sabry): Arabic, and the meaning
 * under it. The list is read in rotation, so each day brings the next card; "All 99 names" opens the whole
 * mosaic with today's card first. English and German meanings are drafts until approved (`TRANSLATIONS_APPROVED`).
 */
export function NameOfDay() {
  const { colors } = usePhase();
  const index = todayNameIndex();
  const name = DIVINE_NAMES[index];
  const meaning = CONTENT_LOCALE === 'ar' ? null : name[CONTENT_LOCALE];
  const n = LOCALE === 'ar' ? String(index + 1).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(index + 1);

  return (
    <View>
      <SectionLabel>{`${t.nameOfDay} · ${t.nameOfN(n)}`}</SectionLabel>
      <View accessible accessibilityLabel={`${t.nameOfDay}: ${name.arabic}${meaning ? `, ${meaning}` : ''}`}>
        <Text style={[styles.arabic, { color: colors.text, fontFamily: Fonts.arabic, fontSize: nameSize(name.arabic), lineHeight: nameSize(name.arabic) * 1.7 }]}>{name.arabic}</Text>
        {meaning ? <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text> : null}
        {meaning && !TRANSLATIONS_APPROVED ? <Text style={[styles.draft, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.namesDraft}</Text> : null}
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/names')} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
        <Text style={[styles.moreText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>{t.namesAll} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  arabic: { textAlign: 'center', marginTop: 6 },
  meaning: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 2 },
  draft: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, opacity: 0.8 },
  more: { alignSelf: 'flex-start', paddingVertical: 12 },
  moreText: { fontSize: 15 },
  pressed: { opacity: 0.6 },
});
