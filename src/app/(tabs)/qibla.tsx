import { qiblaBearing } from '@openathar/athan-core-ts';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { SpriteView, useLoop, useReducedMotion, type Sprite } from '@/components/sprite';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useLocation } from '@/hooks/use-location';
import { distanceKm } from '@/lib/geo';

const KAABA = { lat: 21.4225241, lng: 39.8261818 };
/** Within this many degrees the phone counts as facing the Qibla. */
const ALIGNED_DEG = 4;
/** viewBox half-size; the dial ring sits at RING. */
const V = 170;
const RING = 150;

const KAABA_SPRITE: Sprite = {
  source: require('../../../assets/images/qibla/kaaba-turn.png'),
  frames: 40,
  cols: 8,
  rows: 5,
};

const WINDS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const CARDINALS = [
  { deg: 0, label: 'N' },
  { deg: 90, label: 'E' },
  { deg: 180, label: 'S' },
  { deg: 270, label: 'W' },
];

/** Signed shortest turn from a to b, in −180..180. */
function shortest(a: number, b: number): number {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

/**
 * Device heading, preferring true north: the Qibla bearing is computed from
 * true north, so turning by the magnetic heading would be off by the local
 * magnetic declination (3–5° in Jordan or Germany, far more elsewhere).
 * Readings are low-pass filtered on the circle, so the dial doesn't jitter
 * and never takes the long way round through 0°/360°.
 */
function useHeading() {
  const [heading, setHeading] = useState<{ deg: number; source: 'true' | 'magnetic' } | null>(null);
  const smooth = useRef<number | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const hasTrue = h.trueHeading >= 0;
      const raw = hasTrue ? h.trueHeading : h.magHeading;
      const prev = smooth.current;
      const next = prev === null ? raw : (prev + shortest(prev, raw) * 0.25 + 360) % 360;
      smooth.current = next;
      setHeading({ deg: next, source: hasTrue ? 'true' : 'magnetic' });
    }).then(
      (s) => {
        if (cancelled) s.remove();
        else sub = s;
      },
      () => {}
    );
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);
  return heading;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A quiet dial around the Kaaba. The dial turns against the phone like a
 * real compass card; the Kaaba stays upright at the centre and turns slowly
 * on its own axis. A gold arc runs from the fixed index at the top (where
 * the phone points) to the Qibla mark on the dial — its length is exactly
 * the turn still to make, and it disappears when you face the Qibla.
 */
function Compass({ size, bearing, heading }: { size: number; bearing: number; heading: number | null }) {
  const { colors } = usePhase();
  const gold = colors.stars[0];
  const reduced = useReducedMotion();

  const dial = useSharedValue(0);
  const lastTarget = useRef(0);
  useEffect(() => {
    const target = heading === null ? 0 : -heading;
    const next = lastTarget.current + shortest(lastTarget.current, target);
    lastTarget.current = next;
    dial.value = withTiming(next, { duration: 240, easing: Easing.out(Easing.quad) });
  }, [heading, dial]);

  const aligned = heading !== null && Math.abs(shortest(heading, bearing)) <= ALIGNED_DEG;
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = aligned
      ? withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.45, { duration: 900 })), -1, true)
      : withTiming(0, { duration: 300 });
  }, [aligned, glow]);

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${dial.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  // The remaining turn, drawn along the ring from the top index.
  const arc = useAnimatedProps(() => {
    const a = ((((bearing + dial.value) % 360) + 540) % 360) - 180;
    if (Math.abs(a) <= ALIGNED_DEG) return { d: 'M0 0' };
    const rad = ((a - 90) * Math.PI) / 180;
    const ex = RING * Math.cos(rad);
    const ey = RING * Math.sin(rad);
    return { d: `M0 ${-RING} A ${RING} ${RING} 0 0 ${a > 0 ? 1 : 0} ${ex.toFixed(2)} ${ey.toFixed(2)}` };
  });

  const ticks = useMemo(() => {
    let d = '';
    for (let deg = 0; deg < 360; deg += 5) {
      const len = deg % 90 === 0 ? 12 : deg % 30 === 0 ? 8 : 4;
      const [x1, y1] = polar(RING - 3, deg);
      const [x2, y2] = polar(RING - 3 - len, deg);
      d += `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }
    return d;
  }, []);

  const [qx, qy] = polar(RING, bearing);
  const kaabaSize = Math.round(size * 0.5);
  const turn = useLoop(26_000, KAABA_SPRITE.frames, reduced);
  const box = `${-V} ${-V} ${2 * V} ${2 * V}`;

  return (
    <View style={{ width: size, height: size }}>
      {/* Aligned: the ring breathes in the accent colour */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox={box}>
          <Circle r={RING} fill="none" stroke={colors.accent} strokeWidth={10} strokeOpacity={0.35} />
        </Svg>
      </Animated.View>

      {/* The dial — turns against the phone */}
      <Animated.View style={[StyleSheet.absoluteFill, dialStyle]}>
        <Svg width={size} height={size} viewBox={box}>
          <Circle r={RING} fill="none" stroke={colors.textSecondary} strokeOpacity={0.45} strokeWidth={1} />
          <Path d={ticks} stroke={colors.textSecondary} strokeOpacity={0.55} strokeWidth={1} strokeLinecap="round" />
          {CARDINALS.map((c) => {
            const [x, y] = polar(RING - 30, c.deg);
            return (
              <SvgText
                key={c.label}
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize={17}
                fontFamily={Fonts.display}
                fill={c.deg === 0 ? colors.accent : colors.textSecondary}
                transform={`rotate(${c.deg} ${x.toFixed(2)} ${y.toFixed(2)})`}>
                {c.label}
              </SvgText>
            );
          })}
          {/* Qibla mark on the ring */}
          <G>
            <Circle cx={qx} cy={qy} r={9} fill={gold} fillOpacity={0.2} />
            <Circle cx={qx} cy={qy} r={4.5} fill={gold} />
          </G>
        </Svg>
      </Animated.View>

      {/* Remaining turn, and the fixed index where the phone points */}
      <Svg width={size} height={size} viewBox={box} style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedPath animatedProps={arc} fill="none" stroke={gold} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0 ${-RING - 16} L0 ${-RING + 6}`} stroke={aligned ? colors.accent : colors.text} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>

      {/* The Kaaba at the centre, upright, turning on its own axis */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <SpriteView sprite={KAABA_SPRITE} width={kaabaSize} frame={turn} />
      </View>
    </View>
  );
}

export default function QiblaScreen() {
  const { location } = useLocation();
  const { colors } = usePhase();
  const { width } = useWindowDimensions();
  const heading = useHeading();

  const bearing = qiblaBearing(location.lat, location.lng);
  const km = distanceKm(location, KAABA);
  const wind = WINDS[Math.round(bearing / 22.5) % 16];
  const size = Math.max(0, Math.min(width - 40, 340));
  const aligned = heading !== null && Math.abs(shortest(heading.deg, bearing)) <= ALIGNED_DEG;

  let guidance: string;
  if (heading === null) {
    guidance =
      Platform.OS === 'web'
        ? `The Kaaba lies ${Math.round(bearing)}° clockwise from north — the live compass needs your phone’s sensor.`
        : 'Hold your phone flat to wake the compass.';
  } else {
    const t = shortest(heading.deg, bearing);
    guidance = aligned ? 'You are facing the Qibla.' : `Turn ${t > 0 ? 'right' : 'left'} ${Math.round(Math.abs(t))}°`;
  }

  return (
    <Screen>
      <ScreenHeader title="Qibla" titleAr="القبلة" subtitle={`from ${location.label}`} />

      <View style={styles.compassWrap}>
        <Compass size={size} bearing={bearing} heading={heading?.deg ?? null} />
      </View>

      <Text
        style={[
          styles.guidance,
          { color: aligned ? colors.accent : colors.text, fontFamily: aligned ? Fonts.sansSemiBold : Fonts.sansMedium },
        ]}>
        {guidance}
      </Text>

      <SectionLabel>direction</SectionLabel>
      <Card>
        <View style={styles.readout}>
          <View>
            <Text style={[styles.big, { color: colors.text, fontFamily: Fonts.monoMedium }]}>{Math.round(bearing)}°</Text>
            <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              {wind} · from true north
            </Text>
          </View>
          <View style={styles.readoutRight}>
            <Text style={[styles.big, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
              {Math.round(km).toLocaleString()}
            </Text>
            <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>km to the Kaaba</Text>
          </View>
        </View>
        {heading && (
          <>
            <Divider />
            <View style={styles.sensorRow}>
              <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                heading {Math.round(heading.deg)}°
              </Text>
              <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                {heading.source === 'true' ? 'true north' : 'magnetic — may be off a few °'}
              </Text>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  compassWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidance: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20,
    paddingHorizontal: 12,
  },
  readout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  readoutRight: {
    alignItems: 'flex-end',
  },
  big: {
    fontSize: 30,
    lineHeight: 36,
  },
  small: {
    fontSize: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
