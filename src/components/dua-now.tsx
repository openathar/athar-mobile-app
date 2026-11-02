import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { SectionLabel } from '@/components/screen';
import { useReducedMotion } from '@/components/sprite';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { DUAS, DUAS_BY_PHASE, type Collection, type Dua } from '@/data/duas';
import { IS_RTL, LOCALE, t } from '@/lib/i18n';

type Mode = 'calligraphy' | 'reveal' | 'lines';
const MODES: Mode[] = ['calligraphy', 'reveal', 'lines'];
const PHASE_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const num = (n: string) => (LOCALE === 'ar' ? n.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : n);

/** Hadith grades in Arabic, where the UI is Arabic; elsewhere the transliterated term is the usual one. */
const GRADE_AR: Record<string, string> = { Sahih: 'صحيح', Hasan: 'حسن', 'Hasan Sahih': 'حسن صحيح' };
const gradeLabel = (g: string) => (LOCALE === 'ar' ? (GRADE_AR[g] ?? g) : g);

const collectionName = (c: Collection) =>
  ({ bukhari: t.colBukhari, muslim: t.colMuslim, abudawud: t.colAbudawud, tirmidhi: t.colTirmidhi, ibnmajah: t.colIbnmajah })[c];

const phaseTitle = (phase: (typeof PHASE_ORDER)[number]) =>
  ({ fajr: t.duaFajr, sunrise: t.duaSunrise, dhuhr: t.duaDhuhr, asr: t.duaAsr, maghrib: t.duaMaghrib, isha: t.duaIsha })[phase];

/**
 * Breaks the Arabic into short lines: at its commas first, and a long phrase
 * into even parts of at most five words — never a lone word on its own line.
 */
function toLines(arabic: string): string[] {
  const parts = arabic.split('،').map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const words = p.split(' ');
    const n = Math.ceil(words.length / 5);
    const size = Math.ceil(words.length / n);
    for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size).join(' '));
  }
  return out;
}

/**
 * A du'a for the part of the day you are in — from the hadith collections,
 * quoted word for word, with its source. It changes with the prayer period;
 * which one of the period's du'a, and how it is set, rotates day by day:
 * as calligraphy, word by word, or in lines. Where the hadith gives a count,
 * beads let you keep it.
 */
export function DuaNow() {
  const { colors, phase, now } = usePhase();
  const reduced = useReducedMotion();
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  const list = DUAS_BY_PHASE[phase];
  const [step, setStep] = useState(0);
  // A new prayer period starts fresh.
  useEffect(() => setStep(0), [phase]);

  const dua: Dua = DUAS[list[(day + step) % list.length]];
  const mode = MODES[(day + PHASE_ORDER.indexOf(phase) + step) % MODES.length];
  const meaning = LOCALE === 'ar' ? null : dua.meaning[LOCALE];
  const occasion = dua.occasion[LOCALE];
  const [replay, setReplay] = useState(0);

  return (
    <View>
      <SectionLabel>{phaseTitle(phase)}</SectionLabel>
      <Text style={[styles.occasion, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{occasion}</Text>

      <Pressable
        key={`${dua.key}-${mode}-${replay}`}
        onPress={() => mode !== 'calligraphy' && setReplay((r) => r + 1)}
        accessibilityHint={mode !== 'calligraphy' ? t.duaReplay : undefined}
        style={styles.body}>
        {mode === 'calligraphy' && <Calligraphy text={dua.arabic} />}
        {mode === 'reveal' && <Reveal text={dua.arabic} reduced={reduced} />}
        {mode === 'lines' && <Lines text={dua.arabic} reduced={reduced} />}
        {meaning ? (
          <Delayed after={mode === 'calligraphy' || reduced ? 0 : revealMs(dua.arabic, mode)} reduced={reduced}>
            <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text>
          </Delayed>
        ) : null}
      </Pressable>

      {dua.count ? <Beads key={dua.key} count={dua.count} /> : null}

      {/* JetBrains Mono has no Arabic glyphs: the Arabic source line uses the text face. */}
      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: LOCALE === 'ar' ? Fonts.sans : Fonts.mono }]}>
        {collectionName(dua.collection)} {num(dua.number)}
        {dua.grade && !['bukhari', 'muslim'].includes(dua.collection) ? ` · ${gradeLabel(dua.grade)}` : ''}
      </Text>
      <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.duaMeaningNote}</Text>

      <Pressable onPress={() => setStep((s) => s + 1)} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
        <Text style={[styles.moreText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>{t.duaAnother}</Text>
      </Pressable>
    </View>
  );
}

const WORD_MS = 260;
const LINE_MS = 650;
function revealMs(arabic: string, mode: Mode) {
  return mode === 'reveal' ? arabic.split(' ').length * WORD_MS + 300 : toLines(arabic).length * LINE_MS + 300;
}

/** Large and centred, like a line of calligraphy on the page. */
function Calligraphy({ text }: { text: string }) {
  const { colors } = usePhase();
  return <Text style={[styles.calligraphy, { color: colors.text, fontFamily: Fonts.arabic }]}>{text}</Text>;
}

/** The words arrive one after another at a reading pace, rising slightly into place. */
function Reveal({ text, reduced }: { text: string; reduced: boolean }) {
  const { colors } = usePhase();
  const words = useMemo(() => text.split(' '), [text]);
  return (
    <View style={[styles.words, { flexDirection: IS_RTL ? 'row' : 'row-reverse' }]}>
      {words.map((w, i) => (
        <FadeIn key={i} delay={reduced ? 0 : i * WORD_MS} reduced={reduced} rise={6}>
          <Text style={[styles.word, { color: colors.text, fontFamily: Fonts.arabic }]}>{w}</Text>
        </FadeIn>
      ))}
    </View>
  );
}

/** Set in short lines like verse under a short gold rule, each line arriving in turn. */
function Lines({ text, reduced }: { text: string; reduced: boolean }) {
  const { colors } = usePhase();
  const lines = useMemo(() => toLines(text), [text]);
  return (
    <View style={styles.lines}>
      {/* The rule sits where Arabic starts: physically right in both layouts (logical start in RTL, end in LTR). */}
      <FadeIn delay={0} reduced={reduced}>
        <View style={[styles.rule, { backgroundColor: colors.accent, alignSelf: IS_RTL ? 'flex-start' : 'flex-end' }]} />
      </FadeIn>
      {lines.map((l, i) => (
        <FadeIn key={i} delay={reduced ? 0 : i * LINE_MS} reduced={reduced} rise={0} slide={IS_RTL ? -10 : 10}>
          <Text style={[styles.line, { color: colors.text, fontFamily: Fonts.arabic }]}>{l}</Text>
        </FadeIn>
      ))}
    </View>
  );
}

function FadeIn({ children, delay, reduced, rise = 0, slide = 0 }: { children: React.ReactNode; delay: number; reduced: boolean; rise?: number; slide?: number }) {
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) p.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [delay, reduced, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * rise }, { translateX: (1 - p.value) * slide }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Delayed({ children, after, reduced }: { children: React.ReactNode; after: number; reduced: boolean }) {
  return (
    <FadeIn delay={after} reduced={reduced}>
      {children}
    </FadeIn>
  );
}

/** One bead per time the hadith says to repeat it; tap to light the next, the last one completes it. */
function Beads({ count }: { count: number }) {
  const { colors } = usePhase();
  const [done, setDone] = useState(0);
  const complete = done >= count;
  return (
    <View style={styles.beadsRow}>
      <Pressable
        onPress={() => setDone((d) => (d >= count ? 0 : d + 1))}
        accessibilityRole="button"
        accessibilityLabel={`${t.duaTapCount}: ${done}/${count}`}
        hitSlop={8}
        style={styles.beads}>
        {Array.from({ length: count }, (_, i) => (
          <Bead key={i} on={i < done} colors={colors} />
        ))}
      </Pressable>
      <Text style={[styles.beadsLabel, { color: complete ? colors.accent : colors.textSecondary, fontFamily: complete ? Fonts.sansSemiBold : Fonts.sans }]}>
        {complete ? `${t.duaDone} ✓` : t.duaTapCount}
      </Text>
    </View>
  );
}

function Bead({ on, colors }: { on: boolean; colors: { accent: string; rule: string } }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(on ? 1 : 0, { duration: 280, easing: Easing.out(Easing.back(2)) });
  }, [on, v]);
  return <BeadView v={v} colors={colors} />;
}

function BeadView({ v, colors }: { v: SharedValue<number>; colors: { accent: string; rule: string } }) {
  const inner = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.4 + 0.6 * v.value }] }));
  return (
    <View style={[styles.bead, { borderColor: colors.accent }]}>
      <Animated.View style={[styles.beadFill, { backgroundColor: colors.accent }, inner]} />
    </View>
  );
}

const styles = StyleSheet.create({
  occasion: { fontSize: 13, marginBottom: 6 },
  body: { gap: 10, paddingVertical: 2 },
  calligraphy: { fontSize: 26, lineHeight: 46, textAlign: 'center', writingDirection: 'rtl' },
  words: { flexWrap: 'wrap', columnGap: 7, rowGap: 0 },
  word: { fontSize: 24, lineHeight: 44 },
  lines: { gap: 1, paddingVertical: 2 },
  rule: { width: 36, height: 1.5, marginBottom: 6 },
  line: { fontSize: 23, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl' },
  meaning: { fontSize: 14, lineHeight: 21 },
  beadsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  beads: { flexDirection: 'row', gap: 7 },
  bead: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  beadFill: { width: 11, height: 11, borderRadius: 5.5 },
  beadsLabel: { fontSize: 12, flexShrink: 1 },
  source: { fontSize: 11, marginTop: 8 },
  note: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  more: { paddingVertical: 6, alignSelf: 'flex-start' },
  moreText: { fontSize: 14 },
  pressed: { opacity: 0.7 },
});
