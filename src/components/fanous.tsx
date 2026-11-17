import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { Card, Divider, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { LOCALE, t } from '@/lib/i18n';
import { upcomingObservances } from '@/lib/observances';

/**
 * The Ramadan lantern (fanous): it is lowered on its rope into the screen, settles, then sways and
 * glows. Drawn in SVG (no asset), gold on the night palette, with a warm core. It announces the
 * coming observances — Ramadan first when it is near — below it.
 */

function FanousBody({ gold }: { gold: string }) {
  return (
    <Svg width={108} height={150} viewBox="0 0 120 168">
      <Defs>
        <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3d9a4" stopOpacity="0.95" />
          <Stop offset="0.55" stopColor="#d4a95f" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#8a6a3a" stopOpacity="0.92" />
        </LinearGradient>
        <RadialGradient id="core" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#fff3d6" stopOpacity="1" />
          <Stop offset="0.45" stopColor="#f5c66e" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#f5c66e" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* hanging ring */}
      <Circle cx="60" cy="12" r="6" stroke={gold} strokeWidth="2.5" fill="none" />
      {/* top cap */}
      <Circle cx="60" cy="15" r="3" fill={gold} />
      <Path d="M46 22 L74 22 L70 38 L50 38 Z" fill={gold} />
      {/* glass body */}
      <Path d="M50 38 C 18 56, 18 104, 46 124 L 74 124 C 102 104, 102 56, 70 38 Z" fill="url(#glass)" stroke={gold} strokeWidth="2" />
      {/* warm core */}
      <Circle cx="60" cy="86" r="42" fill="url(#core)" />
      {/* ribs */}
      {[36, 48, 60, 72, 84].map((x) => (
        <Path key={x} d={`M${x} 40 C ${x - 5} 64, ${x - 5} 100, ${x} 122`} stroke={gold} strokeWidth="1.5" fill="none" opacity="0.8" />
      ))}
      <Path d="M26 86 C 44 98, 76 98, 94 86" stroke={gold} strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* bottom cap + finial */}
      <Path d="M46 124 L74 124 L70 136 L50 136 Z" fill={gold} />
      <Circle cx="60" cy="142" r="4" fill={gold} />
    </Svg>
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
          <FanousBody gold={colors.accent} />
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
