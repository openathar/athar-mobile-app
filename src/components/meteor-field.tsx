import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { physicalLeft } from '@/lib/rtl';

/**
 * The background is meteors, nothing else: no stars, no dots, no ornaments.
 *
 * Three independent lanes, each firing at its own random pace. A meteor is a tapered streak that
 * thins to nothing behind a small bright head. It is built from three overlapping slivers of
 * falling opacity, so the tail fades without a gradient. It runs from the upper right toward the
 * lower left, at a slightly different angle, length and speed every time. All motion is on the UI
 * thread; JS only picks the next random flight. With "reduce motion" the sky stays empty.
 */

type Lane = { length: number; first: number; every: [number, number]; color: 0 | 1 };

// [gold, ivory]: most meteors gold, some ivory
const LANES: Lane[] = [
  { length: 170, first: 1000, every: [3600, 6800], color: 0 },
  { length: 120, first: 2800, every: [4600, 8600], color: 1 },
  { length: 210, first: 5200, every: [6400, 11000], color: 0 },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function Meteor({ width, height, lane, colors }: { width: number; height: number; lane: Lane; colors: readonly [string, string] }) {
  const p = useSharedValue(0); // flight progress 0 → 1
  const opacity = useSharedValue(0);
  const x0 = useSharedValue(0);
  const y0 = useSharedValue(0);
  const dx = useSharedValue(0); // total travel in x / y
  const dy = useSharedValue(0);
  const angle = useSharedValue(0); // degrees, the streak's rotation

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const fire = () => {
      if (!alive) return;
      const deg = rand(20, 38); // below the horizontal, heading left
      const rad = (deg * Math.PI) / 180;
      const travel = rand(0.38, 0.7) * Math.max(width, height);
      const ms = rand(850, 1500);
      // start somewhere along the top edge and the right edge
      const fromTop = Math.random() < 0.6;
      x0.value = fromTop ? rand(width * 0.35, width * 1.0) : width * 1.02;
      y0.value = fromTop ? -10 : rand(0, height * 0.35);
      dx.value = -Math.cos(rad) * travel;
      dy.value = Math.sin(rad) * travel;
      angle.value = -deg;
      p.value = 0;
      p.value = withTiming(1, { duration: ms, easing: Easing.bezier(0.2, 0.0, 0.5, 1) });
      opacity.value = withSequence(withTiming(1, { duration: ms * 0.12 }), withDelay(ms * 0.5, withTiming(0, { duration: ms * 0.38 })));
      timer = setTimeout(fire, ms + rand(lane.every[0], lane.every[1]));
    };
    timer = setTimeout(fire, lane.first + Math.random() * 1500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [width, height, lane, x0, y0, dx, dy, angle, p, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x0.value + dx.value * p.value },
      { translateY: y0.value + dy.value * p.value },
      { rotate: `${angle.value}deg` },
    ],
  }));

  const L = lane.length;
  const color = colors[lane.color];
  const H = 12;
  const mid = H / 2;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', ...physicalLeft, top: 0, width: L + 6, height: H }, style]}>
      <Svg width={L + 6} height={H}>
        {/* head on the left; the tail thins to the right in three fading slivers */}
        <Path d={`M3 ${mid}L${L + 3} ${mid - 1.1}L${L + 3} ${mid + 1.1}Z`} fill={color} fillOpacity={0.5} />
        <Path d={`M3 ${mid}L${L * 0.62 + 3} ${mid - 2.1}L${L * 0.62 + 3} ${mid + 2.1}Z`} fill={color} fillOpacity={0.72} />
        <Path d={`M3 ${mid}L${L * 0.28 + 3} ${mid - 3}L${L * 0.28 + 3} ${mid + 3}Z`} fill={color} fillOpacity={1} />
        <Circle cx={3.6} cy={mid} r={2.7} fill="#fffaf0" />
      </Svg>
    </Animated.View>
  );
}

export function MeteorField({
  colors,
}: {
  /** [gold, green, ink]: only gold and ink are used, the green stays with the feelings tree. */
  colors: readonly [string, string, string];
}) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduced(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
      }}>
      {layout && !reduced
        ? LANES.map((lane, i) => <Meteor key={i} width={layout.width} height={layout.height} lane={lane} colors={[colors[0], colors[2]]} />)
        : null}
    </View>
  );
}
