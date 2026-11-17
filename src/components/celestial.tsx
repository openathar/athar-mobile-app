import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { SpriteView, type Sprite } from '@/components/sprite';
import { usePhase } from '@/context/phase';

/*
 * The moon, drawn like the website's: not a texture with a translucent shadow laid over it, but a
 * lit sphere. The phases are pre-rendered (scripts/render-moon-phases.mjs) with the website's own
 * lighting — warm directional light, blue earthshine so the night side is never black, ACES tone
 * mapping — 30 frames, about one per day. The app crossfades the two neighbouring frames, so every
 * minute in between is a real in-between phase, and it all runs on the UI thread.
 *
 * Frame k shows lunation fraction k/30: 0 new moon, 15 full moon, waxing lit on the right.
 * (The sun used to sit next to it. The website knows only the moon; so does the app now.)
 */
const MOON_PHASES: Sprite = {
  source: require('../../assets/images/celestial/moon-phases.jpg'),
  frames: 30,
  cols: 6,
  rows: 5,
};

function Moon({ diameter, now, fraction }: { diameter: number; now: Date; /** Lunation fraction 0..1 on the UI thread — overrides `now` (the orbiting moon). */ fraction?: SharedValue<number> }) {
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const own = useSharedValue((phase.phaseAngle / 360) * MOON_PHASES.frames);
  useEffect(() => {
    own.value = (phase.phaseAngle / 360) * MOON_PHASES.frames;
  }, [phase.phaseAngle, own]);
  const orbit = useDerivedValue(() => (fraction ? fraction.value * MOON_PHASES.frames : 0));
  const frame = fraction ? orbit : own;

  return (
    <View style={styles.center}>
      <SpriteView sprite={MOON_PHASES} width={diameter} frame={frame} style={{ borderRadius: diameter / 2 }} />
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
