import { formatLocalTime, type PrayerTimesResult } from '@openathar/athan-core-ts';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { MethodLine } from '@/components/method-menu';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { IQAMA_NOTE, PRAYER_SUNNAH, type SunnahNote } from '@/data/prayer-sunnah';
import { formatCountdown, getNextPrayer } from '@/hooks/use-prayer';
import { CONTENT_LOCALE, IS_RTL, PRAYER_KEYS, t } from '@/lib/i18n';
import { prayerName } from '@/lib/prayer-names';
import { currentWindow, formatSpan } from '@/lib/prayer-window';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The prayer pair on Today: the current prayer on the left, the next one beside it.
 * - The current prayer's name fades as its time runs out (full at its start, a trace at its end).
 * - The next prayer brightens as it comes closer, and breathes slowly (opacity only; still with
 *   reduced motion).
 * - Tapping the current prayer opens what is hidden: time left, until when, the Sunnah of that
 *   time and the note on the iqama.
 */
export function PrayerPair({ now, times }: { now: Date; times: PrayerTimesResult }) {
  const { colors } = usePhase();
  const [open, setOpen] = useState(false);
  const offsetHours = -now.getTimezoneOffset() / 60;
  const clock = (ms: number) => formatLocalTime(ms, offsetHours);
  const nowMs = now.getTime();

  const w = currentWindow(nowMs, times);
  const next = getNextPrayer(now, times);
  const current =
    w.kind === 'prayer'
      ? prayerName(w.key)
      : { primary: w.kind === 'duha' ? t.nowDuha : w.kind === 'pause' ? t.nowPause : t.nowNight, twin: null as string | null };
  const nextName = prayerName(next.key);

  const progress = clamp01((nowMs - w.start) / (w.end - w.start));
  const fade = 1 - 0.7 * progress; // 1 → 0.3
  const approach = clamp01((nowMs - w.start) / (next.at - w.start));
  const glow = 0.55 + 0.45 * approach; // 0.55 → 1
  const nextStyle = useNextGlow(glow);

  return (
    <View style={styles.wrap}>
      <View style={styles.pair}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${t.nowLabel}: ${current.primary}`}
          style={({ pressed }) => [styles.current, pressed && styles.pressed]}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.nowLabel}</Text>
          <View style={[styles.nameRow, { opacity: fade }]}>
            <Text style={[styles.currentName, { color: colors.text, fontFamily: Fonts.display }]} numberOfLines={1}>
              {current.primary}
            </Text>
            {current.twin ? (
              <Text style={[styles.currentAr, { color: colors.accent, fontFamily: Fonts.arabic }, align()]}>{current.twin}</Text>
            ) : null}
          </View>
          <View style={styles.more}>
            <Text style={[styles.moreText, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              {formatSpan(w.end - nowMs)}
            </Text>
            <Svg width={10} height={10} viewBox="0 0 12 12" style={open ? styles.flip : undefined}>
              <Path d="M2.5 4.5L6 8l3.5-3.5" stroke={colors.textSecondary} strokeWidth={1.5} fill="none" strokeLinecap="round" />
            </Svg>
          </View>
        </Pressable>

        <View style={styles.next}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.nextPrayer}</Text>
          <Animated.View style={[styles.nameRow, nextStyle]}>
            <Text style={[styles.nextName, { color: colors.text, fontFamily: Fonts.display }]}>{nextName.primary}</Text>
            {nextName.twin ? (
              <Text style={[styles.nextAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>{nextName.twin}</Text>
            ) : null}
          </Animated.View>
          <Text style={[styles.countdown, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
            {formatCountdown(next.at - nowMs)}
          </Text>
          <Text style={[styles.at, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {t.at} {clock(next.at)}
          </Text>
        </View>
      </View>

      <MethodLine />

      {open ? (
        <View style={styles.details}>
          <View style={[styles.track, { backgroundColor: colors.rule }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.detailLine, { color: colors.text, fontFamily: Fonts.sansSemiBold }, align()]}>
            {t.nowLeft.replace('{d}', formatSpan(w.end - nowMs))}
            <Text style={{ color: colors.textSecondary, fontFamily: Fonts.sans }}>
              {' · '}
              {t.nowUntil.replace('{t}', clock(w.end))} ({w.endsAt === 'midnight' ? t.nowMidnight : w.endsAt === 'duha' ? t.nowDuha : t[PRAYER_KEYS[w.endsAt]]})
            </Text>
          </Text>
          {w.kind === 'night' ? (
            <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }, align()]}>
              {t.nowLastThird.replace('{t}', clock(w.lastThird))}
            </Text>
          ) : null}
          <Note note={PRAYER_SUNNAH[w.kind === 'prayer' ? w.key : w.kind]} />
          {w.kind === 'prayer' ? <Note note={IQAMA_NOTE} label={t.nowIqama} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const align = () => ({ textAlign: IS_RTL ? ('right' as const) : ('left' as const) });

/** Base brightness from how close the next prayer is, times a slow breath (1 → 0.75). */
function useNextGlow(glow: number) {
  const reduced = useReducedMotion();
  const base = useSharedValue(glow);
  const breath = useSharedValue(1);
  useEffect(() => {
    base.value = withTiming(glow, { duration: 600 });
  }, [glow, base]);
  useEffect(() => {
    if (reduced) {
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(withTiming(0.75, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [reduced, breath]);
  return useAnimatedStyle(() => ({ opacity: base.value * breath.value }));
}

function Note({ note, label }: { note: SunnahNote; label?: string }) {
  const { colors } = usePhase();
  return (
    <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }, align()]}>
      {label ? <Text style={{ color: colors.text, fontFamily: Fonts.sansMedium }}>{label}  </Text> : null}
      {note.text[CONTENT_LOCALE]}{' '}
      <Text style={{ color: colors.accent, fontFamily: Fonts.mono }}>{note.source}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 32,
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  current: {
    flex: 1,
    gap: 2,
  },
  next: {
    flex: 1.7,
    gap: 2,
  },
  label: {
    fontSize: 13,
  },
  currentName: {
    fontSize: 24,
    lineHeight: 34,
  },
  currentAr: {
    fontSize: 22,
    lineHeight: 34,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    minHeight: 24,
  },
  moreText: {
    fontSize: 13,
  },
  flip: {
    transform: [{ rotate: '180deg' }],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 10,
    marginTop: 4,
  },
  // The Latin name and its Arabic twin at the same size.
  nextName: {
    fontSize: 34,
    lineHeight: 44,
    letterSpacing: -1,
  },
  nextAr: {
    fontSize: 34,
    lineHeight: 52,
  },
  countdown: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 1,
  },
  at: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  details: {
    marginTop: 18,
    gap: 8,
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
  },
  detailLine: {
    fontSize: 15,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
});
