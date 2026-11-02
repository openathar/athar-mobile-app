import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { BigMoon } from '@/components/celestial';
import { Earth } from '@/components/earth';
import { useLoop, useReducedMotion } from '@/components/sprite';
import { usePhase } from '@/context/phase';
import { centralMeridian, declinationDeg } from '@/lib/globe';

/** Tilt of the moon's orbit plane against the view — the same slanted look as the website's scene. */
const TILT = (30 * Math.PI) / 180;
/** One orbit in four minutes, like the website: strongly sped up, the real direction. */
const ORBIT_SECONDS = 240;

/**
 * The website's Earth-and-Moon scene: the Earth with its day/night line, and
 * the Moon circling it on a slanted orbit, lit by the same sun (on the right).
 * It starts at today's real elongation — so the shape you see is tonight's
 * real phase — and then drifts around in four minutes, passing through every
 * phase, in front of the Earth and behind it.
 *
 * The orbit runs on the UI thread: position, front/back order and the phase
 * shadow are animated values, so the moon glides at the display's frame rate
 * instead of stepping with React renders.
 */
export function EarthMoon({ width }: { width: number }) {
  const { now } = usePhase();
  const reduced = useReducedMotion();
  const earth = Math.round(width * 0.46);
  const moon = Math.round((earth / 3.67) * 1.15);
  const orbit = width * 0.4;
  const height = Math.round(earth + orbit * Math.sin(TILT) * 2 + moon);
  const cx = width / 2;
  const cy = height / 2;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const start = useMemo(() => moonPhaseAt(now).phaseAngle, [now.toDateString()]);
  const travelled = useLoop(ORBIT_SECONDS * 1000, 360, reduced);

  // Degrees along the orbit (0 = new, 180 = full) and the lunation fraction for the shadow.
  const psi = useDerivedValue(() => start + travelled.value);
  const fraction = useDerivedValue(() => psi.value / 360);

  const moonStyle = useAnimatedStyle(() => {
    const rad = (psi.value * Math.PI) / 180;
    const x = Math.cos(rad) * orbit;
    const z = Math.sin(rad); // > 0: in front of the Earth
    const y = z * orbit * Math.sin(TILT);
    return {
      transform: [{ translateX: cx + x - moon / 2 }, { translateY: cy + y - moon / 2 }],
      zIndex: z >= 0 ? 2 : 0,
    };
  });

  return (
    <View style={{ width, height }}>
      <View style={[styles.abs, { left: cx - earth / 2, top: cy - earth / 2, zIndex: 1 }]}>
        <Earth size={earth} centralLon={centralMeridian(now)} decl={declinationDeg(now)} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.abs, styles.moon, { width: moon, height: moon }, moonStyle]}>
        <BigMoon size={moon / 0.6} fraction={fraction} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  moon: { left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
});
