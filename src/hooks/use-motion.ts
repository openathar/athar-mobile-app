import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing, cancelAnimation, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

/** True when the system asks for reduced motion (then nothing loops by itself). */
export function useReducedMotion(): boolean {
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
  return reduced;
}

/** Drives a shared value 0 → `span` forever while the screen is focused. */
export function useLoop(durationMs: number, span: number, reduced: boolean): SharedValue<number> {
  const v = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      if (reduced) return undefined;
      v.value = withRepeat(withTiming(v.value + span, { duration: durationMs, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(v);
    }, [durationMs, span, reduced, v])
  );
  return v;
}
