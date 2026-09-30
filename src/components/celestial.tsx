import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { SpriteView, useLoop, useReducedMotion, type Sprite } from '@/components/sprite';
import { usePhase } from '@/context/phase';
import { mixHex } from '@/lib/color';

/*
 * The sky's body in the corner of every screen: the sun by day, the moon by
 * night — textured spheres from the same Solar System Scope / NASA maps the
 * website uses, not drawn blobs.
 *
 * A live textured sphere would need a GL context (expo-gl + three.js, a
 * native rebuild). Instead the sphere is projected offline into sprite
 * frames (assets/images/celestial, scripts/render-celestial.mjs) and two
 * neighbouring frames are crossfaded on the UI thread, which reads as
 * continuous motion.
 *
 * Kept true to the sky:
 * - The sun turns about its real 7.25° axis, limb-darkened; its tint follows
 *   its height — deep orange at the horizon, pale gold at noon.
 * - The moon is tidally locked, so it does not spin: it *librates*, tracing
 *   a small closed path (±14° / ±6°) that shows a sliver more of one limb
 *   then another. Tonight's real phase is laid over it live, with a soft
 *   terminator and earthshine on the unlit side.
 */

const MOON_SPRITE: Sprite = {
  source: require('../../assets/images/celestial/moon-libration.jpg'),
  frames: 32,
  cols: 8,
  rows: 4,
};
const SUN_SPRITE: Sprite = {
  source: require('../../assets/images/celestial/sun-rotation.jpg'),
  frames: 60,
  cols: 10,
  rows: 6,
};

function SpriteSphere({ sprite, diameter, frame }: { sprite: Sprite; diameter: number; frame: ReturnType<typeof useLoop> }) {
  return <SpriteView sprite={sprite} width={diameter} frame={frame} style={{ borderRadius: diameter / 2 }} />;
}

/** Region of a disc of radius R lit at `illumination`; the unlit region is the same shape mirrored. */
function discRegion(R: number, illumination: number, rightSide: boolean): string {
  const rx = Math.max(0.001, R * Math.abs(1 - 2 * illumination));
  const outerSweep = rightSide ? 1 : 0;
  const termSweep = rightSide === illumination < 0.5 ? 0 : 1;
  return `M 0 ${-R} A ${R} ${R} 0 0 ${outerSweep} 0 ${R} A ${rx} ${R} 0 0 ${termSweep} 0 ${-R} Z`;
}

function Sun({ size, height, reduced }: { size: number; height: number; reduced: boolean }) {
  const h = Math.min(1, Math.max(0, height));
  const diameter = Math.round(size * 0.6);
  // A tight, soft rim of light — just enough that the disc reads as a light
  // source rather than a flat orange coin. Warmer and wider when low.
  const bloom = mixHex('#ff8f3a', '#ffe7a8', h);
  const bloomR = 50 * (diameter / size) * (1.32 - 0.1 * h);
  const frame = useLoop(90_000, SUN_SPRITE.frames, reduced);

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="-50 -50 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="sun-bloom" cx="50%" cy="50%" r="50%">
            <Stop offset={`${(100 * 0.72).toFixed(0)}%`} stopColor={bloom} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={bloom} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle r={bloomR} fill="url(#sun-bloom)" />
      </Svg>
      <SpriteSphere sprite={SUN_SPRITE} diameter={diameter} frame={frame} />
      {/* A low sun is redder and deeper, as it is through more atmosphere */}
      <View
        pointerEvents="none"
        style={[
          styles.tint,
          { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: '#ff4a14', opacity: 0.22 * (1 - h) },
        ]}
      />
    </View>
  );
}

function Moon({
  size,
  now,
  lit,
  dark,
  reduced,
}: {
  size: number;
  now: Date;
  lit: string;
  dark: string;
  reduced: boolean;
}) {
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const k = phase.illumination;
  const waxing = phase.phaseAngle < 180;
  const diameter = Math.round(size * 0.6);
  const R = 50;

  // The unlit region is the lit region's mirror: left limb while waxing.
  // Three nested shadows with rising opacity give a soft terminator.
  const shadows = useMemo(
    () => [
      { d: discRegion(R, Math.min(1, 1 - k + 0.03), !waxing), o: 0.35 },
      { d: discRegion(R, 1 - k, !waxing), o: 0.35 },
      { d: discRegion(R, Math.max(0, 1 - k - 0.03), !waxing), o: 0.3 },
    ],
    [k, waxing]
  );

  const frame = useLoop(28_000, MOON_SPRITE.frames, reduced);

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ width: diameter, height: diameter }}>
        <SpriteSphere sprite={MOON_SPRITE} diameter={diameter} frame={frame} />
        {/* Tonight's phase, laid over the surface; earthshine keeps the dark side faintly visible */}
        <Svg
          width={diameter}
          height={diameter}
          viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none">
          {shadows.map((s, i) => (
            <Path key={i} d={s.d} fill={dark} fillOpacity={s.o} />
          ))}
          <Circle r={R - 0.5} fill="none" stroke={lit} strokeOpacity={0.22} strokeWidth={1} />
        </Svg>
      </View>
    </View>
  );
}

/** Sun by day, moon by night — whichever is actually up. */
export function Celestial({ size = 104 }: { size?: number }) {
  const { isDay, sunHeight, colors, now } = usePhase();
  const reduced = useReducedMotion();
  const minuteNow = useMemo(() => new Date(Math.floor(now.getTime() / 60000) * 60000), [now]);
  const label = isDay
    ? 'The sun'
    : `The moon, ${Math.round(moonPhaseAt(minuteNow).illumination * 100)} percent illuminated`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} pointerEvents="none">
      {isDay ? (
        <Sun size={size} height={sunHeight} reduced={reduced} />
      ) : (
        <Moon
          size={size}
          now={minuteNow}
          lit={colors.moon.lit}
          dark={colors.moon.dark}
          reduced={reduced}
        />
      )}
    </View>
  );
}

/**
 * Sunlight on the screen, from the top-right corner where the sun sits: a
 * low sun throws a wide warm wash, the noon sun a tight pale one. At night
 * there is none — the sky itself carries the mood.
 */
export function SkyLight({ width }: { width: number }) {
  const { isDay, sunHeight } = usePhase();
  const insets = useSafeAreaInsets();
  if (width <= 0 || !isDay) return null;

  const color = mixHex('#ff8a3d', '#fff1c1', sunHeight);
  const strength = 0.3 - 0.14 * sunHeight;
  const r = width * (1.2 - 0.35 * sunHeight);
  const cx = width - 72;
  const cy = insets.top + 52;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="sky-light" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={color} stopOpacity={strength} />
            <Stop offset="45%" stopColor={color} stopOpacity={strength * 0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={r} fill="url(#sky-light)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tint: {
    position: 'absolute',
  },
});
