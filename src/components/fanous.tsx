import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Card, Divider, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { LOCALE, t } from '@/lib/i18n';
import { upcomingObservances } from '@/lib/observances';

/**
 * The Ramadan lantern (fanous): it is lowered on its rope into the screen, settles, then sways and
 * glows. A real lantern photo (background removed), warmed from inside by a radial glow. It
 * announces the coming observances — Ramadan first when it is near — below it.
 *
 * Photo: "Fanous Ramadan (cropped)" by Ibrahim.ID, CC BY-SA 3.0, via Wikimedia Commons.
 */

const FANOUS = require('../../assets/images/fanous.jpg');
const LANTERN_W = 88;
const LANTERN_H = Math.round((LANTERN_W * 1244) / 618); // source aspect, ~177

function FanousBody() {
  return (
    <View style={{ width: LANTERN_W, height: LANTERN_H }}>
      <Image source={FANOUS} style={{ width: LANTERN_W, height: LANTERN_H }} resizeMode="contain" />
      {/* warm light from inside, layered over the photo's own glow */}
      <Svg width={LANTERN_W} height={LANTERN_H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="fanous-glow" cx="0.5" cy="0.6" r="0.55">
            <Stop offset="0" stopColor="#ffd98a" stopOpacity="0.5" />
            <Stop offset="0.45" stopColor="#f5a94e" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#f5a94e" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={LANTERN_W} height={LANTERN_H} fill="url(#fanous-glow)" />
      </Svg>
    </View>
  );
}

/** The lantern lowered on its rope, then swaying. */
export function Fanous({ height = 250 }: { height?: number }) {
  const { colors } = usePhase();
  const reduced = useReducedMotion();
  const drop = useSharedValue(0); // 0 = still above, 1 = landed
  const sway = useSharedValue(0); // 0..1 loop for the gentle swing

  useEffect(() => {
    if (reduced) {
      drop.value = 1;
      return;
    }
    drop.value = withDelay(200, withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }));
    sway.value = withDelay(1700, withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, true));
    return () => {
      drop.value = 0;
      sway.value = 0;
    };
  }, [reduced, drop, sway]);

  // The whole assembly is lowered, then the lantern swings around its hook.
  const descend = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - drop.value) * -height }] }));
  const swing = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(sway.value * Math.PI * 2) * 2.4}deg` }], transformOrigin: 'top center' }));

  return (
    <View style={{ height, alignItems: 'center', overflow: 'hidden' }}>
      {/* soft halo behind the lantern */}
      <Animated.View style={[styles.halo, { backgroundColor: colors.accent, opacity: 0.16 * drop.value }]} />
      <Animated.View style={[styles.hang, descend]}>
        <View style={[styles.rope, { backgroundColor: colors.rule }]} />
        <Animated.View style={[styles.lantern, swing]}>
          <FanousBody />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** The lantern plus the coming observances it announces (Ramadan first when it is near). */
export function FanousUpcoming() {
  const { colors, now } = usePhase();
  const events = useMemo(() => upcomingObservances(now, 4), [now.toDateString()]);

  return (
    <View>
      <SectionLabel>{t.upcoming}</SectionLabel>
      <Fanous />
      <Card>
        {events.map((e, i) => (
          <View key={e.key}>
            {i > 0 && <Divider />}
            <View style={styles.eventRow}>
              <View style={styles.eventText}>
                <Text style={[styles.eventName, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{e.name}</Text>
                <Text style={[styles.eventNote, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{e.note}</Text>
              </View>
              <Text style={[styles.eventDays, { color: colors.accent, fontFamily: LOCALE === 'ar' ? Fonts.sans : Fonts.mono }]}>{t.inDays(e.days)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  hang: { alignItems: 'center' },
  rope: { width: 1.6, height: 58, borderRadius: 1 },
  lantern: { alignItems: 'center' },
  halo: { position: 'absolute', bottom: 8, width: 190, height: 190, borderRadius: 95 },
  eventRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  eventText: { flex: 1, paddingRight: 14, gap: 3 },
  eventName: { fontSize: 16, lineHeight: 22 },
  eventNote: { fontSize: 13, lineHeight: 19 },
  eventDays: { fontSize: 14, marginLeft: 10 },
});
