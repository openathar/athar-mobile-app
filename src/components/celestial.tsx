import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { cancelAnimation, useSharedValue, withDecay, type SharedValue } from 'react-native-reanimated';

import { MoonSphere } from '@/components/sphere';
import { usePhase } from '@/context/phase';

/*
 * The moon, drawn like the website's: a live-lit sphere (components/sphere.tsx), the same 2048 px
 * texture and the same lighting (warm sun, blue earthshine, ACES), and it turns under the light the
 * way the website's moon does. Lunation fraction 0 is new moon, 0.5 full moon, waxing lit on the right.
 */
function Moon({ diameter, now, fraction, drag }: { diameter: number; now: Date; /** Lunation fraction 0..1 on the UI thread — overrides `now` (the orbiting moon). */ fraction?: SharedValue<number>; drag?: SharedValue<number> }) {
  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const own = useSharedValue(phase.phaseAngle / 360);
  useEffect(() => {
    own.value = phase.phaseAngle / 360;
  }, [phase.phaseAngle, own]);

  return (
    <View style={{ width: diameter, height: diameter }}>
      <MoonSphere size={diameter} fraction={fraction ?? own} drag={drag} />
    </View>
  );
}

/**
 * The moon at any time of day, tonight's phase on a real lit sphere. `size` is its diameter.
 * Drag sideways to turn it (like the Earth): the surface stays under the finger, a flick spins on
 * and slows down. The light does not move, so the phase stays tonight's.
 */
export function BigMoon({ size = 300, fraction, draggable = false }: { size?: number; fraction?: SharedValue<number>; /** Let a finger turn it (Today). */ draggable?: boolean }) {
  const { now } = usePhase();
  const minuteNow = useMemo(() => new Date(Math.floor(now.getTime() / 60000) * 60000), [now]);
  const diameter = Math.round(size);
  const drag = useSharedValue(0);
  const start = useSharedValue(0);
  // A point at the centre of the disc moves r·Δλ, so 1/r radians per pixel keeps it under the finger.
  const radPerPx = 2 / Math.max(1, diameter);

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
      drag.value = start.value - e.translationX * radPerPx;
    },
    onDeactivate: (e) => {
      'worklet';
      drag.value = withDecay({ velocity: -e.velocityX * radPerPx, deceleration: 0.996 });
    },
  });

  return (
    <GestureDetector gesture={pan}>
      <View accessible accessibilityRole="image" accessibilityLabel="The moon" pointerEvents={draggable ? 'auto' : 'none'}>
        <Moon diameter={diameter} now={minuteNow} fraction={fraction} drag={drag} />
      </View>
    </GestureDetector>
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
