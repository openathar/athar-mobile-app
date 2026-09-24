import { moonPhaseAt, type MoonPhaseKey } from '@openathar/athan-core-ts';
import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const MOON_PHASE_LABELS: Record<MoonPhaseKey, string> = {
  new: 'New moon',
  'waxing-crescent': 'Waxing crescent',
  'first-quarter': 'First quarter',
  'waxing-gibbous': 'Waxing gibbous',
  full: 'Full moon',
  'waning-gibbous': 'Waning gibbous',
  'last-quarter': 'Last quarter',
  'waning-crescent': 'Waning crescent',
};

/** "Waxing gibbous · 64% illuminated" — the web's TodaySky line, compact. */
export function moonCaption(now: Date): string {
  const phase = moonPhaseAt(now);
  return `${MOON_PHASE_LABELS[phase.key]} · ${Math.round(phase.illumination * 100)}%`;
}

/**
 * Lit region of the disk as an SVG path: the outer limb arc plus the
 * terminator — a half-ellipse whose horizontal radius is R·|1−2k|.
 * Waxing is lit on the right, waning on the left (northern-hemisphere
 * convention, same orientation as the web's 3D scene).
 */
function litPath(R: number, illumination: number, waxing: boolean): string {
  const rx = Math.max(0.001, R * Math.abs(1 - 2 * illumination));
  const outerSweep = waxing ? 1 : 0;
  const termSweep = waxing === illumination < 0.5 ? 0 : 1;
  return [
    `M 0 ${-R}`,
    `A ${R} ${R} 0 0 ${outerSweep} 0 ${R}`,
    `A ${rx} ${R} 0 0 ${termSweep} 0 ${-R}`,
    'Z',
  ].join(' ');
}

/**
 * Mond — 2D-Geschwister der 3D-Szene auf openathar.org: die echte Phase
 * (Terminator als Ellipse, berechnet statt gemalt), drei weiche Glow-Ringe,
 * die langsam atmen, und Mare-Inseln, die wie die Mondrotation im Web ums
 * Zentrum wandern.
 */
export function Moon({
  size,
  now,
  lit,
  dark,
  glow,
  maria,
}: {
  size: number;
  now: Date;
  lit: string;
  dark: string;
  glow: string;
  maria: string;
}) {
  const R = size / 2;
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const waxing = phase.phaseAngle < 180;
  const path = useMemo(() => litPath(R, phase.illumination, waxing), [R, phase.illumination, waxing]);
  const glowSize = size * 2.4;
  const glowOffset = -glowSize / 2 + size / 2;

  const reduced = useRef(false);
  const breathe = useRef(new Animated.Value(1)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) reduced.current = v;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduced.current) return;
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 0.55,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    // Ein Umlauf der Mare-Inseln in ~160s — das 3D-Pendant rotiert mit
    // 0.045 rad/s (≈140s), hier bewusst etwas langsamer.
    const driftLoop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 160000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    glowLoop.start();
    driftLoop.start();
    return () => {
      glowLoop.stop();
      driftLoop.stop();
    };
  }, [breathe, drift]);

  const mariaSpin = drift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`-${R} -${R} ${size} ${size}`}>
        <Circle r={R} fill={dark} opacity={0.9} />
        <Path d={path} fill={lit} />
      </Svg>
      {/* Mare-Inseln, drehen langsam ums Zentrum — bleiben klar innerhalb der Scheibe */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: mariaSpin }] }]}>
        <Svg width={size} height={size} viewBox={`-${R} -${R} ${size} ${size}`}>
          <Circle cx={-R * 0.3} cy={-R * 0.25} r={R * 0.24} fill={maria} opacity={0.35} />
          <Circle cx={R * 0.25} cy={R * 0.15} r={R * 0.17} fill={maria} opacity={0.28} />
          <Circle cx={R * 0.05} cy={-R * 0.45} r={R * 0.11} fill={maria} opacity={0.25} />
        </Svg>
      </Animated.View>
      {/* Glow-Ringe atmen — wie der Gold/Grün-Schein des Web-Heros */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: breathe, overflow: 'visible' }]}>
        <Svg
          width={glowSize}
          height={glowSize}
          viewBox={`-${R * 1.2} -${R * 1.2} ${glowSize} ${glowSize}`}
          style={{ position: 'absolute', left: glowOffset, top: glowOffset }}>
          <Circle r={R * 1.08} fill={glow} opacity={0.14} />
          <Circle r={R * 1.22} fill={glow} opacity={0.07} />
          <Circle r={R * 1.38} fill={glow} opacity={0.035} />
        </Svg>
      </Animated.View>
    </View>
  );
}
