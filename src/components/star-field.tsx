import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * Dezente Galaxie wie der Web-Hero (components/hero.tsx): wenige, langsam
 * flimmernde Sterne in Gold, Grün und Ink. Positionen kommen aus einem
 * gesigten PRNG — gleiche Verteilung bei jedem Start, kein Flackern bei
 * Re-Renders. Bei reduced motion stehen die Sterne still (Opacity 0.55,
 * wie auf der Website).
 */

type Star = { x: number; y: number; r: number; duration: number; delay: number; color: string };

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStars(width: number, height: number, colors: readonly [string, string, string]): Star[] {
  const rand = mulberry32(7);
  const count = Math.min(60, Math.floor((width * height) / 3200));
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const pick = rand();
    stars.push({
      x: rand() * width,
      y: rand() * height,
      r: rand() * 1.5 + 0.6,
      duration: rand() * 4000 + 2500,
      delay: rand() * 4000,
      color: pick < 0.25 ? colors[0] : pick < 0.37 ? colors[1] : colors[2],
    });
  }
  return stars;
}

function TwinklingStar({ star, reduced }: { star: Star; reduced: boolean }) {
  const opacity = useRef(new Animated.Value(reduced ? 0.55 : 0.35)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.55);
      return;
    }
    const loop = Animated.sequence([
      Animated.delay(star.delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: star.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: star.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced, star.delay, star.duration]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.r * 2,
        height: star.r * 2,
        borderRadius: star.r,
        backgroundColor: star.color,
        opacity,
      }}
    />
  );
}

export function StarField({
  colors,
}: {
  /** [gold, green, ink] — picks like the web hero: 25% gold, 12% green, rest ink. */
  colors: readonly [string, string, string];
}) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
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

  const stars = useMemo(
    () => (layout ? makeStars(layout.width, layout.height, colors) : []),
    [layout, colors]
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout((prev) =>
          prev && prev.width === width && prev.height === height ? prev : { width, height }
        );
      }}>
      {stars.map((s, i) => (
        <TwinklingStar key={i} star={s} reduced={reduced} />
      ))}
    </View>
  );
}
