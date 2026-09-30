import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Image, Platform, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/components/sprite';

/**
 * A smooth, native 3D Kaaba — replaces the 40-frame sprite (choppy, double
 * image on a hard edge). Four walls + a roof, each a plain `View` wearing
 * one flat, unlit face texture (`scripts/render-kaaba-faces.mjs`), placed in
 * 3D with a 4×4 matrix (RN has no `translateZ`) and spun by a Reanimated
 * shared value — everything on the UI thread, 60 fps. Per-face shading (a
 * black overlay whose opacity follows face-normal · light) is recomputed
 * every frame since the light is fixed in the world while the box turns.
 */

const HX = 0.5; // half-width  (12.86 m wall)
const HZ = 0.5 * (11.03 / 12.86); // half-depth (11.03 m wall)
const H = 13.1 / 12.86; // height
const DEG = Math.PI / 180;
/** Same world-fixed light as the offline renderer. */
const LIGHT: [number, number, number] = norm3([-0.55, 0.8, 0.45]);
const SPIN_MS = 26_000;

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

// --- 4×4 row-major matrices (v' = v · M, translation in row 3 — matches
// react-native's own Transform primitives). ---
type Mat = number[];
const IDENTITY: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function matMul(a: Mat, b: Mat): Mat {
  'worklet';
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[r * 4 + k] * b[k * 4 + c];
      out[r * 4 + c] = s;
    }
  }
  return out;
}
function translate(x: number, y: number, z: number): Mat {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
function rotateY(rad: number): Mat {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}
function rotateX(rad: number): Mat {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}
function perspective(p: number): Mat {
  const m = IDENTITY.slice();
  m[11] = -1 / p;
  return m;
}
function normalY(theta: number, nx: number, ny: number, nz: number): [number, number, number] {
  'worklet';
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [nx * c + nz * s, ny, -nx * s + nz * c];
}

type Face = {
  name: 'pz' | 'nz' | 'px' | 'nx' | 'roof';
  /** Static placement: view's own flat plane (facing +Z) -> cube face. */
  place: Mat;
  /** Outward face normal in object space (before spin). */
  normal: [number, number, number];
  width: number; // world units
  height: number;
  source: ImageSourcePropType;
};

function buildFaces(scale: number): Face[] {
  const hx = HX * scale;
  const hz = HZ * scale;
  const h = H * scale;
  return [
    { name: 'pz', place: translate(0, 0, hz), normal: [0, 0, 1], width: 2 * HX, height: H, source: require('../../assets/images/qibla/kaaba-pz.png') },
    { name: 'nz', place: matMul(rotateY(180 * DEG), translate(0, 0, -hz)), normal: [0, 0, -1], width: 2 * HX, height: H, source: require('../../assets/images/qibla/kaaba-nz.png') },
    { name: 'px', place: matMul(rotateY(90 * DEG), translate(hx, 0, 0)), normal: [1, 0, 0], width: 2 * HZ, height: H, source: require('../../assets/images/qibla/kaaba-px.png') },
    { name: 'nx', place: matMul(rotateY(-90 * DEG), translate(-hx, 0, 0)), normal: [-1, 0, 0], width: 2 * HZ, height: H, source: require('../../assets/images/qibla/kaaba-nx.png') },
    { name: 'roof', place: matMul(rotateX(90 * DEG), translate(0, -h / 2, 0)), normal: [0, 1, 0], width: 2 * HX, height: 2 * HZ, source: require('../../assets/images/qibla/kaaba-roof.png') },
  ];
}

/**
 * react-native-web maps the `matrix` transform key to the 6-argument CSS
 * `matrix()` (2D) regardless of array length, so a 16-element 4x4 matrix is
 * silently dropped as invalid CSS there. `matrix3d` gets the right CSS
 * function name and isn't a real RN style key, so it's cast through.
 */
const MATRIX_KEY = Platform.OS === 'web' ? 'matrix3d' : 'matrix';

function FaceView({
  face,
  theta,
  scale,
  cam,
  proj,
}: {
  face: Face;
  theta: SharedValue<number>;
  scale: number;
  cam: Mat;
  proj: Mat;
}) {
  const style = useAnimatedStyle(() => {
    const spin = rotateY(theta.value);
    const m = matMul(matMul(face.place, spin), matMul(cam, proj));
    return { transform: [{ [MATRIX_KEY]: m }] } as never;
  });
  const shadeStyle = useAnimatedStyle(() => {
    const n = normalY(theta.value, face.normal[0], face.normal[1], face.normal[2]);
    const diffuse = 0.32 + 0.68 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    return { opacity: Math.min(0.72, Math.max(0, 1 - diffuse)) };
  });

  const w = face.width * scale;
  const h = face.height * scale;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <Animated.View style={[{ width: w, height: h, backfaceVisibility: 'hidden' as const }, style]}>
        <Image source={face.source} style={{ width: w, height: h }} resizeMode="stretch" />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, shadeStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * The Kaaba, upright, turning slowly on its own vertical axis. `size` is the
 * on-screen diameter it should roughly occupy.
 */
export function Kaaba3D({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const theta = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      if (reduced) return undefined;
      theta.value = withRepeat(withTiming(theta.value + 2 * Math.PI, { duration: SPIN_MS, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(theta);
    }, [reduced, theta])
  );

  // Camera: slightly above, looking down a little — matches the offline
  // renderer's elevation. Pushed back along +Z so the box sits in front of
  // the perspective's vanishing point instead of straddling it.
  const scale = size / (2 * HX) / 1.9;
  const faces = useMemo(() => buildFaces(scale), [scale]);
  const camDist = 3.4;
  const elev = 12 * DEG;
  const cam = useMemo(() => matMul(rotateX(-elev), translate(0, 0, -camDist * (2 * HX) * scale)), [scale]);
  const proj = useMemo(() => perspective(camDist * (2 * HX) * scale * 1.35), [scale]);

  if (size <= 0) return null;
  return (
    <View style={{ width: size, height: size }}>
      {faces.map((f) => (
        <FaceView key={f.name} face={f} theta={theta} scale={scale} cam={cam} proj={proj} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
