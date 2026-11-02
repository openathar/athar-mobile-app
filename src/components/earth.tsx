import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { SpriteView, type Sprite } from '@/components/sprite';
import { greatCircle, nearestSheet, wrap180, type GlobeSide, type SheetDecl } from '@/lib/globe';

const SHEETS: Record<SheetDecl, number> = {
  [-23]: require('../../assets/images/earth/earth-d-23.jpg'),
  [-12]: require('../../assets/images/earth/earth-d-12.jpg'),
  0: require('../../assets/images/earth/earth-d0.jpg'),
  12: require('../../assets/images/earth/earth-d12.jpg'),
  23: require('../../assets/images/earth/earth-d23.jpg'),
};
const SHEETS_LEFT: Record<SheetDecl, number> = {
  [-23]: require('../../assets/images/earth/earth-L-d-23.jpg'),
  [-12]: require('../../assets/images/earth/earth-L-d-12.jpg'),
  0: require('../../assets/images/earth/earth-L-d0.jpg'),
  12: require('../../assets/images/earth/earth-L-d12.jpg'),
  23: require('../../assets/images/earth/earth-L-d23.jpg'),
};
const PLAIN: number = require('../../assets/images/earth/earth-plain.jpg');
const sprite = (d: SheetDecl, side: GlobeSide): Sprite => ({
  source: side === 'plain' ? PLAIN : side === 'left' ? SHEETS_LEFT[d] : SHEETS[d],
  frames: 36,
  cols: 6,
  rows: 6,
});

const DEG = Math.PI / 180;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** `lib/globe.project` as a worklet: screen position of a place for central meridian `lc`. */
function projectW(lat: number, lon: number, lc: number, lean: number) {
  'worklet';
  const a = lean * DEG;
  const phi = lat * DEG;
  const lam = (lon - lc) * DEG;
  const u = Math.cos(phi) * Math.sin(lam);
  const s = Math.sin(phi);
  const w = Math.cos(phi) * Math.cos(lam);
  return { x: u * Math.cos(a) + s * Math.sin(a), y: -u * Math.sin(a) + s * Math.cos(a), z: w };
}

export type Pin = { lat: number; lon: number; color: string; size?: number; ring?: boolean };

/**
 * The website's Earth, in the pocket: real NASA textures, city lights on the
 * night side, a computed day/night line that leans with the season. The
 * sheet is pre-rendered (scripts/render-earth.mjs) and the frame follows the
 * actual time of day, so the planet turns as the day goes by.
 *
 * Drag to turn it: the gesture and the rotation run on the UI thread, the
 * surface under the finger stays under the finger (1:1 at the centre), and
 * a flick keeps it spinning and slowing down. Pins and the great-circle arc
 * are animated props computed with the same projection, so they ride along
 * in the same frame — React does not re-render while you drag.
 */
export function Earth({
  size,
  centralLon,
  decl,
  side = 'right',
  pins = [],
  arc,
  arcColor,
  draggable = true,
}: {
  size: number;
  /** Central meridian in degrees (what faces the viewer) before any dragging. */
  centralLon: number;
  /** Sun declination in degrees (season). */
  decl: number;
  /** Which way the sun is on screen; `plain` = evenly lit, no day/night line (any central meridian). */
  side?: GlobeSide;
  pins?: Pin[];
  arc?: [{ lat: number; lon: number }, { lat: number; lon: number }];
  arcColor?: string;
  draggable?: boolean;
}) {
  const sheet = nearestSheet(decl);
  // The axis leans toward the sun: right for a sun on the right, left for a sun on the left.
  const lean = side === 'plain' ? 0 : side === 'left' ? -decl : decl;
  const r = size / 2;

  // `base` follows the clock (unwrapped, so it never jumps across ±180°);
  // `drag` is what the finger added. The globe shows base + drag.
  const base = useSharedValue(centralLon);
  const last = useRef(centralLon);
  useEffect(() => {
    const d = wrap180(centralLon - wrap180(last.current));
    last.current = last.current + d;
    base.value = withTiming(last.current, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [centralLon, base]);

  const drag = useSharedValue(0);
  const start = useSharedValue(0);
  // A point at the centre of the disc moves r·Δλ (radians) — so this many degrees per pixel keeps it under the finger.
  const degPerPx = 180 / (Math.PI * Math.max(1, r));

  const pan = usePanGesture({
    enabled: draggable,
    // Horizontal only: a vertical swipe stays with the page's scroll view.
    activeOffsetX: [-6, 6],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      cancelAnimation(drag);
      start.value = drag.value;
    },
    onUpdate: (e) => {
      'worklet';
      drag.value = start.value - e.translationX * degPerPx;
    },
    onDeactivate: (e) => {
      'worklet';
      drag.value = withDecay({ velocity: -e.velocityX * degPerPx, deceleration: 0.996 });
    },
  });

  const lon = useDerivedValue(() => base.value + drag.value);
  // Frame n shows central meridian n·10 − 180; the sprite layers wrap the index.
  const frame = useDerivedValue(() => (lon.value + 180) / 10);

  const arcPoints = useMemo(() => (arc ? greatCircle(arc[0], arc[1]) : []), [arc]);

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel="The Earth, with the day and night line">
        <SpriteView sprite={sprite(sheet, side)} width={size} frame={frame} style={{ borderRadius: r }} />
        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          {arcPoints.length ? <ArcLine points={arcPoints} lon={lon} lean={lean} r={r} color={arcColor ?? '#d4a95f'} /> : null}
          {pins.map((p, i) => (
            <PinMark key={i} pin={p} lon={lon} lean={lean} r={r} />
          ))}
        </Svg>
      </View>
    </GestureDetector>
  );
}

function PinMark({ pin, lon, lean, r }: { pin: Pin; lon: SharedValue<number>; lean: number; r: number }) {
  const s = pin.size ?? 4;
  const props = useAnimatedProps(() => {
    const q = projectW(pin.lat, pin.lon, lon.value, lean);
    return { cx: r + q.x * (r - 1), cy: r - q.y * (r - 1), opacity: q.z > 0.02 ? 1 : 0 };
  });
  return (
    <G>
      {pin.ring ? <AnimatedCircle animatedProps={props} r={s * 2.6} fill="none" stroke={pin.color} strokeOpacity={0.6} strokeWidth={1} /> : null}
      <AnimatedCircle animatedProps={props} r={s} fill={pin.color} stroke="#0b0f17" strokeOpacity={0.5} strokeWidth={1} />
    </G>
  );
}

function ArcLine({
  points,
  lon,
  lean,
  r,
  color,
}: {
  points: { lat: number; lon: number }[];
  lon: SharedValue<number>;
  lean: number;
  r: number;
  color: string;
}) {
  const props = useAnimatedProps(() => {
    let d = '';
    let pen = false;
    for (let i = 0; i < points.length; i++) {
      const v = projectW(points[i].lat, points[i].lon, lon.value, lean);
      if (v.z <= 0.02) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${(r + v.x * (r - 1)).toFixed(1)} ${(r - v.y * (r - 1)).toFixed(1)}`;
      pen = true;
    }
    // An empty path is invalid on some platforms: keep a stub, hidden.
    return { d: d || 'M0 0', opacity: d ? 1 : 0 };
  });
  return <AnimatedPath animatedProps={props} stroke={color} strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" fill="none" />;
}
