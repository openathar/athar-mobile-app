import { Canvas, Circle, Group, Line, LinearGradient, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

/**
 * The background is meteors, nothing else: no stars, no dots, no ornaments.
 *
 * Each meteor is one hairline that fades to nothing behind a bright head: a single gradient stroke
 * (transparent at the tail, full colour at the head), a thinner white core over its leading third,
 * and a pin-point head. Skia draws it, so the edge is crisp at any pixel density and the fade is
 * smooth instead of stepped.
 *
 * Three independent lanes, each firing at its own random pace, from the upper right toward the lower
 * left at a slightly different angle, length and speed every time. All motion is on the UI thread;
 * JS only picks the next random flight. With "reduce motion" the sky stays empty.
 */

type Lane = { first: number; every: [number, number]; color: 0 | 1; tail: [number, number] };

// [gold, ivory]: most meteors gold, some ivory
const LANES: Lane[] = [
  { first: 900, every: [3400, 6600], color: 0, tail: [190, 280] },
  { first: 2600, every: [4400, 8400], color: 1, tail: [130, 200] },
  { first: 5000, every: [6200, 11000], color: 0, tail: [240, 340] },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** '#rrggbb' → 'rgba(r,g,b,a)' so the gradient can start fully transparent. */
function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function Meteor({ width, height, lane, color }: { width: number; height: number; lane: Lane; color: string }) {
  const p = useSharedValue(0); // flight progress 0 → 1
  const fade = useSharedValue(0);
  const x0 = useSharedValue(0);
  const y0 = useSharedValue(0);
  const ux = useSharedValue(-1); // unit direction of flight (heading left and down)
  const uy = useSharedValue(0.5);
  const travel = useSharedValue(0);
  const tail = useSharedValue(200);
  const weight = useSharedValue(1.6);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const fire = () => {
      if (!alive) return;
      const rad = (rand(18, 36) * Math.PI) / 180;
      ux.value = -Math.cos(rad);
      uy.value = Math.sin(rad);
      travel.value = rand(0.55, 0.95) * Math.max(width, height);
      tail.value = rand(lane.tail[0], lane.tail[1]);
      weight.value = rand(1.3, 2.1);
      const fromTop = Math.random() < 0.6;
      x0.value = fromTop ? rand(width * 0.35, width * 1.05) : width * 1.04;
      y0.value = fromTop ? -16 : rand(0, height * 0.32);
      const ms = rand(1000, 1700);
      p.value = 0;
      p.value = withTiming(1, { duration: ms, easing: Easing.bezier(0.25, 0.1, 0.35, 1) });
      fade.value = withSequence(withTiming(1, { duration: ms * 0.14 }), withDelay(ms * 0.46, withTiming(0, { duration: ms * 0.4 })));
      timer = setTimeout(fire, ms + rand(lane.every[0], lane.every[1]));
    };
    timer = setTimeout(fire, lane.first + Math.random() * 1200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [width, height, lane, x0, y0, ux, uy, travel, tail, weight, p, fade]);

  const head = useDerivedValue(() => vec(x0.value + ux.value * travel.value * p.value, y0.value + uy.value * travel.value * p.value));
  // The tail grows out of the head at the start of the flight, then trails at full length.
  const tailEnd = useDerivedValue(() => {
    const len = tail.value * Math.min(1, p.value * 6);
    return vec(head.value.x - ux.value * len, head.value.y - uy.value * len);
  });
  const coreEnd = useDerivedValue(() => {
    const len = tail.value * 0.34 * Math.min(1, p.value * 6);
    return vec(head.value.x - ux.value * len, head.value.y - uy.value * len);
  });
  const clear = rgba(color, 0);
  const full = rgba(color, 0.95);

  const bodyFull = rgba(color, 0.3);

  return (
    <Group opacity={fade}>
      {/* body: a wide, faint underlay so the tail has substance */}
      <Line p1={tailEnd} p2={head} strokeWidth={useDerivedValue(() => weight.value * 3.4)} strokeCap="round">
        <LinearGradient start={tailEnd} end={head} colors={[clear, bodyFull]} />
      </Line>
      {/* the streak itself */}
      <Line p1={tailEnd} p2={head} strokeWidth={useDerivedValue(() => weight.value * 1.3)} strokeCap="round">
        <LinearGradient start={tailEnd} end={head} colors={[clear, full]} />
      </Line>
      {/* white-hot core over the leading third */}
      <Line p1={coreEnd} p2={head} strokeWidth={1.4} strokeCap="round">
        <LinearGradient start={coreEnd} end={head} colors={['rgba(255,250,240,0)', 'rgba(255,250,240,1)']} />
      </Line>
      <Circle c={head} r={4.4} color={rgba(color, 0.22)} />
      <Circle c={head} r={2.2} color="#fffaf0" />
    </Group>
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
      {layout && !reduced ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {LANES.map((lane, i) => (
            <Meteor key={i} width={layout.width} height={layout.height} lane={lane} color={lane.color === 0 ? colors[0] : colors[2]} />
          ))}
        </Canvas>
      ) : null}
    </View>
  );
}
