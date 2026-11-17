import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { SpriteView, useLoop, useReducedMotion, type Sprite } from '@/components/sprite';
import { usePhase } from '@/context/phase';
import { physicalLeft } from '@/lib/rtl';

/*
 * The moon, drawn like the website's: a lit sphere, not a texture with a translucent shadow, and it
 * MOVES. The website's 3D moon turns its surface under a fixed light; here two pre-rendered layers
 * give the same effect without a GL context:
 *
 *   surface  24 frames of the near side along a closed libration path (+-10 deg / +-5 deg), unlit.
 *            It loops slowly while the screen is in focus, so craters drift the way the real moon's
 *            face wobbles.
 *   shade    30 phases of the shadow (a navy overlay whose alpha is the darkness, with the website's
 *            lighting: warm sun, blue earthshine, ACES). It stays where the sun puts it.
 *
 * Both layers crossfade their two neighbouring frames on the UI thread, so every minute in between is
 * a real in-between phase. Shade frame k shows lunation fraction k/30: 0 new moon, 15 full moon,
 * waxing lit on the right. (The sun used to sit next to it; the website knows only the moon.)
 */
const SURFACE: Sprite = { source: require('../../assets/images/celestial/moon-libration.jpg'), frames: 24, cols: 6, rows: 4 };
const SHADE: Sprite = { source: require('../../assets/images/celestial/moon-shade.png'), frames: 30, cols: 6, rows: 5 };
/** One libration cycle. Slow enough to read as the moon's own, quick enough to be seen on the start page. */
const LIBRATION_MS = 40_000;

function Moon({ diameter, now, fraction }: { diameter: number; now: Date; /** Lunation fraction 0..1 on the UI thread — overrides `now` (the orbiting moon). */ fraction?: SharedValue<number> }) {
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const reduced = useReducedMotion();
  const wobble = useLoop(LIBRATION_MS, SURFACE.frames, reduced);
  const own = useSharedValue((phase.phaseAngle / 360) * SHADE.frames);
  useEffect(() => {
    own.value = (phase.phaseAngle / 360) * SHADE.frames;
  }, [phase.phaseAngle, own]);
  const orbit = useDerivedValue(() => (fraction ? fraction.value * SHADE.frames : 0));
  const shadeFrame = fraction ? orbit : own;

  return (
    <View style={[styles.center, { width: diameter, height: diameter, borderRadius: diameter / 2, overflow: 'hidden' }]}>
      <SpriteView sprite={SURFACE} width={diameter} frame={wobble} />
      <SpriteView sprite={SHADE} width={diameter} frame={shadeFrame} style={[styles.layer, physicalLeft]} />
    </View>
  );
}

/** The moon at any time of day, tonight's phase on a real lit sphere. `size` is its diameter. */
export function BigMoon({ size = 300, fraction }: { size?: number; fraction?: SharedValue<number> }) {
  const { now } = usePhase();
  const minuteNow = useMemo(() => new Date(Math.floor(now.getTime() / 60000) * 60000), [now]);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="The moon" pointerEvents="none">
      <Moon diameter={Math.round(size)} now={minuteNow} fraction={fraction} />
    </View>
  );
}

/** The small moon in the corner of every screen (`size` is the box the layout reserves; the moon fills 60% of it). */
export function Celestial({ size = 104 }: { size?: number }) {
  const { now } = usePhase();
  const minuteNow = useMemo(() => new Date(Math.floor(now.getTime() / 60000) * 60000), [now]);
  const label = `The moon, ${Math.round(moonPhaseAt(minuteNow).illumination * 100)} percent illuminated`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} pointerEvents="none" style={[styles.center, { width: size, height: size }]}>
      <Moon diameter={Math.round(size * 0.6)} now={minuteNow} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
