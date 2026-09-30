import type { PrayerTimesResult } from '@openathar/athan-core-ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop } from 'react-native-svg';

import type { PhasePalette } from '@/constants/theme';
import { PRAYER_ORDER, type PrayerKey } from '@/hooks/use-prayer';

/**
 * فلك — "and each swims in an orbit" (Ya-Sin 36:40), sibling verse to the
 * 36:12 athar verse the platform is named for.
 */
export const FALAK_AYAH = { ar: 'كُلٌّ فِي فَلَكٍ يَسْبَحُونَ', ref: '36:40' } as const;

/**
 * The religious day as a tilted orbit seen in perspective — not a clock
 * face. The six stations sit at their true angular position in the day, the
 * night arc recedes behind the day arc, and "now" rides the ring at the
 * front. One full turn per 24h: the rotation is the day passing, not an
 * animation.
 *
 * 3D is computed here rather than taken from a library: a circle in the XY
 * plane is tilted around the X axis, then perspective-projected, and the
 * segments are painted far-to-near. That keeps the app free of a GL context
 * (no native rebuild, no three.js bundle) while still being real 3D —
 * depth changes size, brightness and overlap.
 */

/** viewBox spans -100..100 on both axes. */
const VIEW = 200;
/** Kept well inside the viewBox so the near arc never clips at any scale. */
const RING_R = 62;
/** 0° = face-on circle, 90° = edge-on line. 62° reads as an orbit. */
const TILT = (62 * Math.PI) / 180;
/** Camera distance; lower = stronger perspective. */
const FOCAL = 300;
const SEGMENTS = 96;
const COS_TILT = Math.cos(TILT);
const SIN_TILT = Math.sin(TILT);

type Projected = { x: number; y: number; z: number; scale: number };

/** Tilt around X, then perspective-project onto the screen plane. */
function project(angle: number, radius: number): Projected {
  const x0 = radius * Math.cos(angle);
  const y0 = radius * Math.sin(angle);
  const y = y0 * COS_TILT;
  const z = y0 * SIN_TILT;
  const scale = FOCAL / (FOCAL - z);
  return { x: x0 * scale, y: y * scale, z, scale };
}

/** Local time of day as a 0..1 fraction — the ring's angular coordinate. */
function fractionOfDay(ms: number): number {
  const d = new Date(ms);
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
}

const PRAYER_SHORT: Record<PrayerKey, string> = {
  fajr: 'FAJR',
  sunrise: 'SHURUQ',
  dhuhr: 'DHUHR',
  asr: 'ASR',
  maghrib: 'MAGHRIB',
  isha: 'ISHA',
};

export function Falak({
  size,
  now,
  times,
  nextKey,
  colors,
}: {
  size: number;
  now: Date;
  times: PrayerTimesResult;
  nextKey: PrayerKey;
  colors: PhasePalette;
}) {
  const [reduced, setReduced] = useState(false);
  const unfold = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduced(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Entrance: the orbit unfolds from edge-on to its tilt. Native-driven, so
  // the SVG itself is rendered once and never re-laid-out during the reveal.
  useEffect(() => {
    if (reduced) {
      unfold.setValue(1);
      return;
    }
    const anim = Animated.timing(unfold, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, unfold]);

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  // Geometry only needs to follow the minute: a 24h turn moves the ring by
  // 0.25° per minute, so recomputing per second would burn work for nothing.
  const minuteKey = Math.floor(now.getTime() / 60000);
  const geometry = useMemo(() => {
    const nowFraction = fractionOfDay(now.getTime());
    // Put "now" at the front of the orbit (nearest the viewer, lower on
    // screen), so the ring reads as turning under a fixed observer.
    const spin = Math.PI / 2 - nowFraction * Math.PI * 2;

    const sunriseF = fractionOfDay(times.sunrise);
    const maghribF = fractionOfDay(times.maghrib);
    const isDaylight = (f: number) =>
      sunriseF <= maghribF ? f >= sunriseF && f < maghribF : f >= sunriseF || f < maghribF;

    const segments = Array.from({ length: SEGMENTS }, (_, i) => {
      const f0 = i / SEGMENTS;
      const f1 = (i + 1) / SEGMENTS;
      const a = project(f0 * Math.PI * 2 + spin, RING_R);
      const b = project(f1 * Math.PI * 2 + spin, RING_R);
      return { a, b, day: isDaylight((f0 + f1) / 2), z: (a.z + b.z) / 2 };
    }).sort((p, q) => p.z - q.z); // painter's algorithm: far first

    const stations = PRAYER_ORDER.map((key) => {
      const f = fractionOfDay(times[key]);
      const angle = f * Math.PI * 2 + spin;
      return {
        key,
        point: project(angle, RING_R),
        passed: times[key] <= now.getTime(),
      };
    }).sort((p, q) => p.point.z - q.point.z);

    const nowPoint = project(Math.PI / 2, RING_R);
    return { segments, stations, nowPoint };
  }, [minuteKey, times, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = geometry.stations.find((s) => s.key === nextKey);
  // viewBox units -> pixels, for the native-driven overlay glow.
  const toPx = (v: number) => ((v + VIEW / 2) / VIEW) * size;

  // The first layout pass can report a zero/negative width; an SVG with a
  // negative size is invalid, so skip the render until there is room.
  if (size <= 0) return null;

  return (
    <View pointerEvents="none" style={{ width: size, height: size }} accessible
      accessibilityRole="image"
      accessibilityLabel={`Orbit of today's prayers. Next: ${PRAYER_SHORT[nextKey]}.`}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: unfold,
            // The unfold reads as the orbit tipping open from edge-on.
            transform: [{ scaleY: unfold.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] }) }],
          },
        ]}>
        <Svg width={size} height={size} viewBox={`-100 -100 ${VIEW} ${VIEW}`}>
          <Defs>
            <RadialGradient id="falak-core" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.24} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Faint core glow at the orbit's centre — the sun the day turns around. */}
          <Circle r={RING_R * 0.92} fill="url(#falak-core)" />

          {/* The orbit itself, painted far-to-near so the night arc passes
              behind the day arc instead of crossing it. Kept deliberately
              quiet: the countdown sits on top of it and must stay dominant. */}
          <G>
            {geometry.segments.map((seg, i) => {
              const depth = (seg.a.scale - 0.82) * 3.4;
              return (
                <Line
                  key={i}
                  x1={seg.a.x}
                  y1={seg.a.y}
                  x2={seg.b.x}
                  y2={seg.b.y}
                  stroke={seg.day ? colors.accent : colors.rule}
                  strokeWidth={(seg.day ? 1.9 : 1.4) * seg.a.scale}
                  strokeOpacity={Math.max(0.1, Math.min(1, (seg.day ? 0.3 : 0.2) + 0.45 * depth))}
                  strokeLinecap="round"
                />
              );
            })}
          </G>

          {/* Stations: the six prayers at their true angle in the day. Left
              unlabelled on purpose — the list below already names each one,
              and labels out here collided with the countdown. */}
          {geometry.stations.map((s) => {
            const isNext = s.key === nextKey;
            const r = (isNext ? 4.4 : 2.9) * s.point.scale;
            const fill = isNext ? colors.accent : s.passed ? colors.textSecondary : colors.text;
            const depth = 0.32 + 0.68 * (s.point.scale - 0.82) * 3.4;
            return (
              <Circle
                key={s.key}
                cx={s.point.x}
                cy={s.point.y}
                r={r}
                fill={fill}
                opacity={Math.max(0.25, Math.min(1, isNext ? depth : depth * 0.8))}
              />
            );
          })}

          {/* "Now" rides the front of the orbit. */}
          <Circle
            cx={geometry.nowPoint.x}
            cy={geometry.nowPoint.y}
            r={2.2 * geometry.nowPoint.scale}
            fill={colors.text}
          />
        </Svg>
      </Animated.View>

      {/* Pulse on the next prayer — a separate native-driven layer so the
          SVG above stays static between minutes. */}
      {next && !reduced && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: toPx(next.point.x) - 14,
            top: toPx(next.point.y) - 14,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent,
            opacity: Animated.multiply(unfold, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.22] })),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.25] }) }],
          }}
        />
      )}
    </View>
  );
}
