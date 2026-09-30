import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Pre-rendered 3D, played back smoothly. A sprite sheet holds the frames of
 * one turn in a grid (≤ 2048 px per side, the safe texture size on older
 * Android GPUs); two stacked layers show frame n and n+1, the upper one
 * faded in by the fractional part — so a 40-frame turn reads as continuous
 * rotation. Everything runs on the UI thread.
 */
export type Sprite = { source: ImageSourcePropType; frames: number; cols: number; rows: number };

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

function Layer({
  sprite,
  width,
  height,
  frame,
  next,
}: {
  sprite: Sprite;
  width: number;
  height: number;
  frame: SharedValue<number>;
  next: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const f = frame.value;
    const base = Math.floor(f);
    const idx = (((base + (next ? 1 : 0)) % sprite.frames) + sprite.frames) % sprite.frames;
    return {
      opacity: next ? f - base : 1,
      transform: [{ translateX: -(idx % sprite.cols) * width }, { translateY: -Math.floor(idx / sprite.cols) * height }],
    };
  });
  return (
    <Animated.View style={[styles.sheet, style]}>
      <Image
        source={sprite.source}
        style={{ width: sprite.cols * width, height: sprite.rows * height }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
}

/** One animated sprite; `frame` is a (fractional) frame index, wrapped. */
export function SpriteView({
  sprite,
  width,
  height = width,
  frame,
  style,
}: {
  sprite: Sprite;
  width: number;
  height?: number;
  frame: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      <Layer sprite={sprite} width={width} height={height} frame={frame} next={false} />
      <Layer sprite={sprite} width={width} height={height} frame={frame} next />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
