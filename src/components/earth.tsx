import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { SpriteView, type Sprite } from '@/components/sprite';
import { frameFor, greatCircle, nearestSheet, project, type GlobeSide, type SheetDecl } from '@/lib/globe';

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

export type Pin = { lat: number; lon: number; color: string; size?: number; ring?: boolean };

/**
 * The website's Earth, in the pocket: real NASA textures, city lights on the
 * night side, a computed day/night line that leans with the season. The
 * sheet is pre-rendered (scripts/render-earth.mjs) and the frame follows the
 * actual time of day, so the planet turns as the day goes by; drag to turn
 * it yourself. Pins and a great-circle arc are drawn on top with the same
 * projection the sprites were rendered with.
 */
export function Earth({
  size,
  centralLon,
  decl,
  side = 'right',
  pins = [],
  arc,
  arcColor,
  onSpin,
}: {
  size: number;
  /** Central meridian in degrees (what faces the viewer). */
  centralLon: number;
  /** Sun declination in degrees (season). */
  decl: number;
  /** Which way the sun is on screen; `plain` = evenly lit, no day/night line (any central meridian). */
  side?: GlobeSide;
  pins?: Pin[];
  arc?: [{ lat: number; lon: number }, { lat: number; lon: number }];
  arcColor?: string;
  /** Called with degrees of longitude while the user drags. */
  onSpin?: (deltaLon: number) => void;
}) {
  const sheet = nearestSheet(decl);
  // The axis leans toward the sun: right for a sun on the right, left for a sun on the left.
  const lean = side === 'plain' ? 0 : side === 'left' ? -decl : decl;
  const frame = useSharedValue(frameFor(centralLon));
  const last = useRef(frameFor(centralLon));

  useEffect(() => {
    // Take the short way round the 36-frame loop.
    const target = frameFor(centralLon);
    let d = target - (last.current % 36);
    if (d > 18) d -= 36;
    if (d < -18) d += 36;
    last.current = last.current + d;
    frame.value = withTiming(last.current, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [centralLon, frame]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!onSpin,
        onMoveShouldSetPanResponder: (_, g) => !!onSpin && Math.abs(g.dx) > 4,
        onPanResponderMove: (_, g) => onSpin?.(-g.vx * 14),
      }),
    [onSpin]
  );

  const r = size / 2;
  const toXY = (lat: number, lon: number) => {
    const p = project(lat, lon, centralLon, lean);
    return { x: r + p.x * (r - 1), y: r - p.y * (r - 1), z: p.z };
  };
  const arcPath = useMemo(() => {
    if (!arc) return '';
    let d = '';
    let pen = false;
    for (const p of greatCircle(arc[0], arc[1])) {
      const v = project(p.lat, p.lon, centralLon, lean);
      if (v.z <= 0.02) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${(r + v.x * (r - 1)).toFixed(1)} ${(r - v.y * (r - 1)).toFixed(1)}`;
      pen = true;
    }
    return d;
  }, [arc, centralLon, lean, r]);

  return (
    <View {...pan.panHandlers} style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel="The Earth, with the day and night line">
      <SpriteView sprite={sprite(sheet, side)} width={size} frame={frame} style={{ borderRadius: r }} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        {arcPath ? <Path d={arcPath} stroke={arcColor ?? '#d4a95f'} strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" fill="none" /> : null}
        {pins.map((p, i) => {
          const q = toXY(p.lat, p.lon);
          if (q.z <= 0.02) return null;
          const s = p.size ?? 4;
          return (
            <G key={i}>
              {p.ring ? <Circle cx={q.x} cy={q.y} r={s * 2.6} fill="none" stroke={p.color} strokeOpacity={0.6} strokeWidth={1} /> : null}
              <Circle cx={q.x} cy={q.y} r={s} fill={p.color} stroke="#0b0f17" strokeOpacity={0.5} strokeWidth={1} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
