import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { MoonSphere } from '@/components/sphere';
import { usePhase } from '@/context/phase';

/*
 * The moon, drawn like the website's: a live-lit sphere (components/sphere.tsx), the same 2048 px
 * texture and the same lighting (warm sun, blue earthshine, ACES), and it turns under the light the
 * way the website's moon does. Lunation fraction 0 is new moon, 0.5 full moon, waxing lit on the right.
 */
function Moon({ diameter, now, fraction }: { diameter: number; now: Date; /** Lunation fraction 0..1 on the UI thread — overrides `now` (the orbiting moon). */ fraction?: SharedValue<number> }) {
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const own = useSharedValue(phase.phaseAngle / 360);
  useEffect(() => {
    own.value = phase.phaseAngle / 360;
  }, [phase.phaseAngle, own]);

  return (
    <View style={{ width: diameter, height: diameter }}>
      <MoonSphere size={diameter} fraction={fraction ?? own} />
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
