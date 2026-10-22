import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import reflections from '@/data/reflections.json';
import { LOCALE, t } from '@/lib/i18n';

type Entry = (typeof reflections.entries)[number];
const ENTRIES = reflections.entries as Entry[];

function dayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000) % ENTRIES.length;
}

/**
 * The verse and a measured observation, side by side. Offline: the verse text
 * and its translation are bundled with the app (copy of the website's
 * `data/reflections.json`); the sign of the day is deterministic per day and
 * "another sign" steps to the next one. The provenance line is always shown.
 */
export function TwoBooks() {
  const { colors } = usePhase();
  const [step, setStep] = useState(0);
  const entry = useMemo(() => ENTRIES[(dayIndex(new Date()) + step) % ENTRIES.length], [step]);
  const translation = LOCALE === 'ar' ? null : (entry.fallback as Record<string, string>)[LOCALE];
  const field = (entry.field as Record<string, string>)[LOCALE];
  const observation = (entry.observation as Record<string, string>)[LOCALE];

  return (
    <View>
      <SectionLabel>{t.books}</SectionLabel>
      <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.booksLead}</Text>

      <View style={[styles.block, { borderTopColor: colors.rule }]}>
        <Text style={[styles.tag, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
          {t.revelation} · {entry.verse}
        </Text>
        <Text style={[styles.verse, { color: colors.text, fontFamily: Fonts.arabic }]}>{entry.fallback.arabic}</Text>
        {translation ? <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{translation}</Text> : null}
      </View>

      <View style={[styles.block, { borderTopColor: colors.rule }]}>
        <Text style={[styles.tag, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
          {t.creation} · {field}
        </Text>
        <Text style={[styles.observation, { color: colors.text, fontFamily: Fonts.sans }]}>{observation}</Text>
        <Text style={[styles.fine, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          {t.provenance}
          {LOCALE === 'ar' && !reflections.provenance.arabicApproved ? ` ${t.arabicPending}` : ''}
        </Text>
      </View>

      <Pressable onPress={() => setStep((s) => s + 1)} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
        <Text style={[styles.moreText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>{t.anotherSign}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, marginBottom: 14 },
  block: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 18, gap: 10 },
  tag: { fontSize: 14 },
  verse: { fontSize: 28, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  body: { fontSize: 16, lineHeight: 25 },
  observation: { fontSize: 18, lineHeight: 28 },
  fine: { fontSize: 13, lineHeight: 19 },
  more: { paddingVertical: 8, alignSelf: 'flex-start' },
  moreText: { fontSize: 16 },
  pressed: { opacity: 0.7 },
});
