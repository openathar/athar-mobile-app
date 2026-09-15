import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * Khatam — achtzackiger Stern aus zwei ueberlagerten Quadraten, wie das
 * Signet auf openathar.org. Rotiert sehr langsam (90s pro Umdrehung).
 */
export function Khatam({
  size,
  color,
  opacity = 1,
  duration = 90000,
  reverse = false,
}: {
  size: number;
  color: string;
  opacity?: number;
  duration?: number;
  reverse?: boolean;
}) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, duration]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['0deg', '-360deg'] : ['0deg', '360deg'],
  });

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size} viewBox="-40 -40 80 80">
          <Rect
            x={-28}
            y={-28}
            width={56}
            height={56}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={opacity}
          />
          <Rect
            x={-28}
            y={-28}
            width={56}
            height={56}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={opacity}
            transform="rotate(45)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}