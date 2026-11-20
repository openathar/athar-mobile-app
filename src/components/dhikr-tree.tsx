import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { useTasbih } from '@/hooks/use-tasbih';
import { ROOT, TREE_BOX, buildTree, leafPath, pathsByDepth, visibleTree } from '@/lib/dhikr-tree';
import { IS_RTL, LOCALE, t } from '@/lib/i18n';
import { position, todayCount, type PhraseKey } from '@/lib/tasbih';

/** The part of the drawing the tree actually fills (the crown never rises above y≈200). */
const VIEW = { x: 0, y: 170, w: TREE_BOX, h: TREE_BOX - 170 + 20 };

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const num = (n: number) => (LOCALE === 'ar' ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(n));

const MEANING: Record<PhraseKey, () => string> = {
  subhan: () => t.phSubhan,
  hamd: () => t.phHamd,
  akbar: () => t.phAkbar,
};

/**
 * Your tree: a tasbih counter whose count you can see. Every tap grows the
 * tree a little (the newest branch is drawn part-way), leaves follow the
 * branches, and every full round of 100 opens a gold blossom. The shape comes
 * from a seed planted on this phone, so each person's tree is their own.
 * Nothing leaves the device.
 */
export function DhikrTree() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const reduced = useReducedMotion();
  const { state, tap, reset } = useTasbih();
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
  }, []);

  const tree = useMemo(() => (state ? buildTree(state.seed) : null), [state?.seed]);
  // Dev preview, like `?at=HH:MM` for the clock: `/tree?preview=650` draws the tree at that count.
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const previewN = __DEV__ && preview ? Number(preview) : NaN;
  const total = Number.isFinite(previewN) ? previewN : (state?.total ?? 0);
  const vis = useMemo(() => (tree ? visibleTree(tree, total) : null), [tree, total]);
  const branches = useMemo(() => (vis ? pathsByDepth(vis.segments) : []), [vis]);
  const leaves = useMemo(() => (vis ? vis.leaves.map(leafPath).join('') : ''), [vis]);
  const tip = vis?.segments[vis.segments.length - 1]?.b;

  const w = Math.min(width - 24, 520);
  const h = (w * VIEW.h) / VIEW.w;
  const pos = position(total);
  const today = state ? todayCount(state, new Date()) : 0;

  // A soft press on the circle; the tree itself is the reward.
  const pulse = useSharedValue(1);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const onCount = () => {
    const m = tap();
    if (!reduced) pulse.value = withSequence(withTiming(0.94, { duration: 70 }), withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }));
    // iOS ignores vibration lengths (always a long buzz), so it only marks a finished round there.
    if (m === 'round') {
      Vibration.vibrate(Platform.OS === 'android' ? [0, 40, 80, 40] : undefined);
      setNote(t.tasbihBlossom);
      if (noteTimer.current) clearTimeout(noteTimer.current);
      noteTimer.current = setTimeout(() => setNote(null), 4000);
    } else if (Platform.OS === 'android') {
      Vibration.vibrate(m === 'phrase' ? 30 : 8);
    }
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      reset();
      return;
    }
    Alert.alert(t.tasbihResetTitle, t.tasbihResetBody, [
      { text: t.cancel, style: 'cancel' },
      { text: t.tasbihReset, style: 'destructive', onPress: reset },
    ]);
  };

  const meaning = MEANING[pos.phrase.key]();
  const a11y = `${meaning || pos.phrase.ar}, ${num(pos.inPhrase)} / ${num(pos.phrase.times)}`;

  return (
    <View>
      <Pressable
        onPress={onCount}
        disabled={!state}
        accessible={false}
        style={[styles.figure, { width: w, height: h }]}>
        <Svg width={w} height={h} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}>
          <Line x1={60} x2={940} y1={ROOT.y} y2={ROOT.y} stroke={colors.rule} strokeWidth={2} />
          {branches.map((b) => (
            <Path key={b.depth} d={b.d} stroke={colors.text} strokeWidth={b.width} strokeLinecap="round" fill="none" opacity={0.92 - b.depth * 0.06} />
          ))}
          {leaves ? <Path d={leaves} fill={colors.green} fillOpacity={0.78} /> : null}
          {vis?.blossoms.map((l, i) => (
            <Circle key={i} cx={l.x} cy={l.y} r={9} fill={colors.accent} stroke={colors.background} strokeWidth={3} />
          ))}
          {tip && total > 0 ? <Circle cx={tip.x} cy={tip.y} r={6} fill={colors.accent} /> : null}
        </Svg>
      </Pressable>

      <View style={styles.phrase}>
        <Text style={[styles.ar, { color: colors.accent, fontFamily: Fonts.arabic }]}>{pos.phrase.ar}</Text>
        {meaning ? <Text style={[styles.meaning, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{meaning}</Text> : null}
      </View>

      <View style={styles.counterRow}>
        <Animated.View style={ring}>
          <Pressable
            onPress={onCount}
            disabled={!state}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityHint={t.tasbihTap}
            style={({ pressed }) => [styles.counter, { borderColor: colors.accent, backgroundColor: pressed ? colors.accent : 'transparent' }]}>
            {({ pressed }) => (
              <>
                <Text style={[styles.counterN, { color: pressed ? colors.onAccent : colors.text, fontFamily: Fonts.monoMedium }]}>{num(pos.inPhrase)}</Text>
                <Text style={[styles.counterOf, { color: pressed ? colors.onAccent : colors.textSecondary, fontFamily: Fonts.mono }]}>/ {num(pos.phrase.times)}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
        <View style={styles.steps}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.step, { backgroundColor: i === pos.index ? colors.accent : colors.rule, width: i === pos.index ? 22 : 8 }]} />
          ))}
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{note ?? t.tasbihTap}</Text>

      <View style={[styles.stats, { borderColor: colors.rule }]}>
        {[
          [t.tasbihToday, today],
          [t.tasbihTotal, total],
          [t.tasbihRounds, pos.rounds],
        ].map(([k, v]) => (
          <View key={String(k)} style={styles.stat}>
            <Text style={[styles.statV, { color: colors.text, fontFamily: Fonts.mono }]}>{num(Number(v))}</Text>
            <Text style={[styles.statK, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{k}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.tasbihSource}</Text>
      {total > 0 ? (
        <Pressable onPress={confirmReset} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.resetWrap, pressed && styles.pressed]}>
          <Text style={[styles.reset, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
            {t.tasbihReset} {IS_RTL ? '←' : '→'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  figure: { alignSelf: 'center', marginTop: 4 },
  phrase: { alignItems: 'center', marginTop: 4, gap: 2 },
  ar: { fontSize: 40, lineHeight: 64, textAlign: 'center' },
  meaning: { fontSize: 15, textAlign: 'center' },
  counterRow: { alignItems: 'center', marginTop: 18, gap: 14 },
  counter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterN: { fontSize: 36, lineHeight: 42 },
  counterOf: { fontSize: 13 },
  steps: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  step: { height: 4, borderRadius: 2 },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 10, minHeight: 18 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statV: { fontSize: 22 },
  statK: { fontSize: 13 },
  source: { fontSize: 13, lineHeight: 19, marginTop: 14 },
  resetWrap: { alignSelf: 'flex-start', marginTop: 10 },
  reset: { fontSize: 14 },
  pressed: { opacity: 0.6 },
});
