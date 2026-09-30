import { qiblaBearing, type PrayerTimesResult } from '@openathar/athan-core-ts';
import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, PanResponder, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { Fonts, type PhasePalette } from '@/constants/theme';
import { PRAYER_ORDER, type PrayerKey } from '@/hooks/use-prayer';

/**
 * فلك — "and each swims in an orbit" (Ya-Sin 36:40), sibling verse to the
 * 36:12 athar verse the platform is named for.
 */
export const FALAK_AYAH = { ar: 'كُلٌّ فِي فَلَكٍ يَسْبَحُونَ', ref: '36:40' } as const;

/*
 * A living armillary sphere of the user's own sky — the instrument of the
 * Maragha and Ibn al-Shatir tradition, computed rather than drawn.
 *
 * Prayer times ARE sun positions, so the scene shows why today's times fall
 * where they do: the sun's diurnal circle is tilted by the user's latitude,
 * cut by the horizon, and coloured by altitude — daylight above the horizon,
 * twilight down to −18° (where Fajr and Isha sit), night below. Each prayer
 * is a bead exactly where the sun stands at that moment; a gnomon casts the
 * real shadow (the Asr definition) and the horizon carries the Qibla.
 *
 * Rendering: all 3D is projected in worklets on the UI thread (Reanimated),
 * so the orbiting camera runs at display rate without re-rendering React.
 * Paint order does the occlusion: everything below the horizon is drawn
 * first, then the translucent horizon disk, then everything above it.
 */

const DEG = Math.PI / 180;
/** Camera height above the horizon plane. */
const ELEV = 16 * DEG;
const CE = Math.cos(ELEV);
const SE = Math.sin(ELEV);
/** Camera distance in sphere radii — lower means stronger perspective. */
const DIST = 4.2;
/** Half-width of the sun's band, as a fraction of the diurnal radius. */
const BAND_W = 0.065;
const SAMPLES = 144;
/** sin(−18°): below this the sky is fully dark (Fajr/Isha threshold). */
const SIN_TWILIGHT = Math.sin(-18 * DEG);
const GNOMON = 0.17;
const DAY_MS = 86_400_000;
/** One camera orbit, in ms. */
const ORBIT_MS = 96_000;

type Scene = {
  sinP: number;
  cosP: number;
  sinD: number;
  cosD: number;
  hNow: number;
  qE: number;
  qN: number;
};

type P2 = { x: number; y: number; z: number; s: number };

/** World (east, up, north) -> screen, for a camera orbiting at `theta`. */
function project(e: number, u: number, n: number, theta: number, R: number): P2 {
  'worklet';
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const x = e * ct + n * st;
  const z0 = e * st - n * ct;
  const yc = u * CE - z0 * SE;
  const zc = z0 * CE + u * SE;
  const s = DIST / (DIST - zc);
  return { x: x * s * R, y: -yc * s * R, z: zc, s };
}

/** Unit vector to the sun at hour angle H (0 = transit, + = afternoon). */
function sunAt(H: number, sc: Scene) {
  'worklet';
  const cH = Math.cos(H);
  return {
    e: -sc.cosD * Math.sin(H),
    n: sc.sinD * sc.cosP - sc.cosD * cH * sc.sinP,
    u: sc.sinD * sc.sinP + sc.cosD * cH * sc.cosP,
  };
}

/** 2 = day, 1 = twilight, 0 = night — by the sine of the sun's altitude. */
function altClass(u: number): number {
  'worklet';
  return u >= 0 ? 2 : u >= SIN_TWILIGHT ? 1 : 0;
}

function pt(p: P2): string {
  'worklet';
  return p.x.toFixed(1) + ' ' + p.y.toFixed(1);
}

function poly(outer: string[], inner: string[]): string {
  'worklet';
  let s = 'M' + outer[0];
  for (let i = 1; i < outer.length; i++) s += 'L' + outer[i];
  for (let i = inner.length - 1; i >= 0; i--) s += 'L' + inner[i];
  return s + 'Z';
}

/** The sun's band for one altitude class, as closed polygons (one per run). */
function bandPath(sc: Scene, theta: number, R: number, cls: number): string {
  'worklet';
  const cu = sc.sinD * sc.sinP;
  const cn = sc.sinD * sc.cosP;
  let d = '';
  let outer: string[] = [];
  let inner: string[] = [];
  let prevO = '';
  let prevI = '';
  let prevIn = false;
  for (let i = 0; i <= SAMPLES; i++) {
    const p = sunAt(-Math.PI + (2 * Math.PI * i) / SAMPLES, sc);
    const re = p.e;
    const ru = p.u - cu;
    const rn = p.n - cn;
    const os = pt(project(re * (1 + BAND_W), cu + ru * (1 + BAND_W), cn + rn * (1 + BAND_W), theta, R));
    const is = pt(project(re * (1 - BAND_W), cu + ru * (1 - BAND_W), cn + rn * (1 - BAND_W), theta, R));
    const inCls = altClass(p.u) === cls;
    // Share the boundary sample with the neighbouring run so bands meet flush.
    if (inCls && !prevIn && prevO) {
      outer.push(prevO);
      inner.push(prevI);
    }
    if (inCls || prevIn) {
      outer.push(os);
      inner.push(is);
    }
    if (!inCls && prevIn) {
      d += poly(outer, inner);
      outer = [];
      inner = [];
    }
    prevO = os;
    prevI = is;
    prevIn = inCls;
  }
  if (outer.length > 1) d += poly(outer, inner);
  return d || 'M0 0';
}

/** Arc of the meridian (the N–zenith–S–nadir circle) between two angles. */
function meridianArc(theta: number, R: number, from: number, to: number): string {
  'worklet';
  let d = '';
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const p = project(0, Math.sin(a), Math.cos(a), theta, R);
    d += (i === 0 ? 'M' : 'L') + pt(p);
  }
  return d;
}

function wrapAngle(a: number): number {
  const t = (a + Math.PI) % (2 * Math.PI);
  return (t < 0 ? t + 2 * Math.PI : t) - Math.PI;
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / DAY_MS);
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

const LABELS: Record<PrayerKey, string> = {
  fajr: 'FAJR',
  sunrise: 'SHURUQ',
  dhuhr: 'DHUHR',
  asr: 'ASR',
  maghrib: 'MAGHRIB',
  isha: 'ISHA',
};

type Common = {
  scene: SharedValue<Scene>;
  theta: SharedValue<number>;
  R: number;
  ox: number;
  oy: number;
};

/** A bead riding the sun's circle at hour angle H (or at "now" when null). */
function Bead({
  scene,
  theta,
  R,
  ox,
  oy,
  H,
  size,
  color,
  halo,
}: Common & { H: number | null; size: number; color: string; halo?: string }) {
  const style = useAnimatedStyle(() => {
    const sc = scene.value;
    const p = sunAt(H === null ? sc.hNow : H, sc);
    const q = project(p.e, p.u, p.n, theta.value, R);
    const depth = Math.min(1, Math.max(0.35, 0.35 + (q.s - 0.82) * 1.5));
    return {
      opacity: depth,
      transform: [
        { translateX: ox + q.x - size / 2 },
        { translateY: oy + q.y - size / 2 },
        { scale: q.s },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.bead, { width: size, height: size }, style]}>
      {halo ? (
        <View
          style={{
            position: 'absolute',
            left: -size,
            top: -size,
            width: size * 3,
            height: size * 3,
            borderRadius: size * 1.5,
            backgroundColor: halo,
            opacity: 0.22,
          }}
        />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}

/** Label pushed outward from the diurnal circle's centre, so it never sits on the band. */
function BeadLabel({
  scene,
  theta,
  R,
  ox,
  oy,
  H,
  text,
  color,
}: Common & { H: number; text: string; color: string }) {
  const W = 72;
  const style = useAnimatedStyle(() => {
    const sc = scene.value;
    const p = sunAt(H, sc);
    const q = project(p.e, p.u, p.n, theta.value, R);
    const c = project(0, sc.sinD * sc.sinP, sc.sinD * sc.cosP, theta.value, R);
    let dx = q.x - c.x;
    let dy = q.y - c.y;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    dx /= len;
    dy /= len;
    const depth = Math.min(1, Math.max(0.3, 0.3 + (q.s - 0.82) * 1.6));
    return {
      opacity: depth,
      transform: [{ translateX: ox + q.x + dx * 20 - W / 2 }, { translateY: oy + q.y + dy * 16 - 7 }],
    };
  });
  return (
    <Animated.Text
      pointerEvents="none"
      numberOfLines={1}
      style={[styles.label, { width: W, color, fontFamily: Fonts.monoMedium }, style]}>
      {text}
    </Animated.Text>
  );
}

/** A label fixed to the horizon ring (cardinal points, Qibla). */
function HorizonLabel({
  theta,
  R,
  ox,
  oy,
  e,
  n,
  text,
  color,
  arabic,
}: Omit<Common, 'scene'> & { e: number; n: number; text: string; color: string; arabic?: boolean }) {
  const W = 56;
  const style = useAnimatedStyle(() => {
    const q = project(e * 1.16, 0, n * 1.16, theta.value, R);
    return {
      opacity: Math.min(1, Math.max(0.25, 0.25 + (q.s - 0.82) * 1.7)),
      transform: [{ translateX: ox + q.x - W / 2 }, { translateY: oy + q.y - 8 }],
    };
  });
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.label,
        { width: W, color, fontFamily: arabic ? Fonts.arabicBold : Fonts.monoMedium, fontSize: arabic ? 13 : 10 },
        style,
      ]}>
      {text}
    </Animated.Text>
  );
}

function FalakScene({
  size,
  minuteMs,
  times,
  lat,
  lng,
  nextKey,
  colors,
}: {
  size: number;
  /** "now", rounded to the minute — the sun moves 0.25°/min, finer is wasted work. */
  minuteMs: number;
  times: PrayerTimesResult;
  lat: number;
  lng: number;
  nextKey: PrayerKey;
  colors: PhasePalette;
}) {
  const height = Math.round(size * 0.9);
  const R = size * 0.33;
  const ox = size / 2;
  const oy = height * 0.52;
  const gold = colors.stars[0];

  const model = useMemo(() => {
    const date = new Date(minuteMs);
    const decl = -23.44 * DEG * Math.cos(((2 * Math.PI) / 365) * (dayOfYear(date) + 10));
    const phi = lat * DEG;
    const qibla = qiblaBearing(lat, lng) * DEG;
    const hourAngle = (t: number) => wrapAngle((2 * Math.PI * (t - times.dhuhr)) / DAY_MS);
    const scene: Scene = {
      sinP: Math.sin(phi),
      cosP: Math.cos(phi),
      sinD: Math.sin(decl),
      cosD: Math.cos(decl),
      hNow: hourAngle(minuteMs),
      qE: Math.sin(qibla),
      qN: Math.cos(qibla),
    };
    const stations = PRAYER_ORDER.map((key) => {
      const H = hourAngle(times[key]);
      return { key, H, above: sunAt(H, scene).u >= 0 };
    });
    return { scene, stations, sunAbove: sunAt(scene.hNow, scene).u >= 0 };
  }, [minuteMs, lat, lng, times]);

  const scene = useSharedValue<Scene>(model.scene);
  useEffect(() => {
    scene.value = model.scene;
  }, [model.scene, scene]);

  // Camera: a slow orbit plus whatever the finger adds. Starts facing the
  // equator-side sky, where the sun actually travels.
  const theta0 = lat >= 0 ? -0.45 : Math.PI - 0.45;
  const spin = useSharedValue(0);
  const drag = useSharedValue(0);
  const theta = useDerivedValue(() => theta0 + spin.value + drag.value);

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

  // Orbit only while the screen is focused — no GPU work on hidden tabs.
  useFocusEffect(
    useCallback(() => {
      if (reduced) return undefined;
      spin.value = withRepeat(
        withTiming(spin.value + 2 * Math.PI, { duration: ORBIT_MS, easing: Easing.linear }),
        -1,
        false
      );
      return () => cancelAnimation(spin);
    }, [reduced, spin])
  );

  const dragStart = useRef(0);
  const pan = useMemo(
    () =>
      PanResponder.create({
        // Claim only horizontal drags so the screen can still scroll vertically.
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dragStart.current = drag.value;
        },
        onPanResponderMove: (_e, g) => {
          drag.value = dragStart.current + g.dx * 0.012;
        },
      }),
    [drag]
  );

  // Horizon circle and gnomon are symmetric about the vertical axis, so a
  // camera orbiting that axis never changes them: computed once, not per frame.
  const staticGeo = useMemo(() => {
    let rim = '';
    for (let i = 0; i <= 96; i++) {
      const a = (2 * Math.PI * i) / 96;
      rim += (i === 0 ? 'M' : 'L') + pt(project(Math.cos(a), 0, Math.sin(a), 0, R));
    }
    const base = project(0, 0, 0, 0, R);
    const top = project(0, GNOMON, 0, 0, R);
    return { rim: rim + 'Z', gnomon: `M${pt(base)}L${pt(top)}` };
  }, [R]);

  const nightProps = useAnimatedProps(() => ({ d: bandPath(scene.value, theta.value, R, 0) }));
  const twilightProps = useAnimatedProps(() => ({ d: bandPath(scene.value, theta.value, R, 1) }));
  const dayProps = useAnimatedProps(() => ({ d: bandPath(scene.value, theta.value, R, 2) }));
  const meridianUpper = useAnimatedProps(() => ({ d: meridianArc(theta.value, R, 0, Math.PI) }));
  const meridianLower = useAnimatedProps(() => ({ d: meridianArc(theta.value, R, Math.PI, 2 * Math.PI) }));

  // Celestial axis, split at the horizon: the visible pole's half is drawn
  // above the disk, the hidden pole's half below it.
  const axisUp = useAnimatedProps(() => {
    const sc = scene.value;
    const k = sc.sinP >= 0 ? 1.18 : -1.18;
    return { d: `M${pt(project(0, 0, 0, theta.value, R))}L${pt(project(0, sc.sinP * k, sc.cosP * k, theta.value, R))}` };
  });
  const axisDown = useAnimatedProps(() => {
    const sc = scene.value;
    const k = sc.sinP >= 0 ? -1.18 : 1.18;
    return { d: `M${pt(project(0, 0, 0, theta.value, R))}L${pt(project(0, sc.sinP * k, sc.cosP * k, theta.value, R))}` };
  });

  const ticks = useAnimatedProps(() => {
    let d = '';
    for (let i = 0; i < 24; i++) {
      const a = (2 * Math.PI * i) / 24;
      const inner = i % 6 === 0 ? 0.86 : 0.93;
      d += 'M' + pt(project(Math.sin(a), 0, Math.cos(a), theta.value, R));
      d += 'L' + pt(project(Math.sin(a) * inner, 0, Math.cos(a) * inner, theta.value, R));
    }
    return { d };
  });

  const qiblaLine = useAnimatedProps(() => {
    const sc = scene.value;
    return {
      d: `M${pt(project(0, 0, 0, theta.value, R))}L${pt(project(sc.qE * 0.97, 0, sc.qN * 0.97, theta.value, R))}`,
    };
  });
  const qiblaMark = useAnimatedProps(() => {
    const sc = scene.value;
    // A small rhombus lying on the horizon plane, pointing toward the Kaaba.
    const fe = sc.qE;
    const fn = sc.qN;
    const se = -fn;
    const sn = fe;
    const t = theta.value;
    const a = project(fe * 1.07, 0, fn * 1.07, t, R);
    const b = project(fe * 1.0 + se * 0.035, 0, fn * 1.0 + sn * 0.035, t, R);
    const c = project(fe * 0.93, 0, fn * 0.93, t, R);
    const d2 = project(fe * 1.0 - se * 0.035, 0, fn * 1.0 - sn * 0.035, t, R);
    return { d: `M${pt(a)}L${pt(b)}L${pt(c)}L${pt(d2)}Z` };
  });

  // The gnomon's shadow: opposite the sun, length h·cot(alt) — the quantity
  // the Asr time is defined by. Hidden while the sun is down.
  const shadow = useAnimatedProps(() => {
    const sc = scene.value;
    const p = sunAt(sc.hNow, sc);
    if (p.u <= 0.02) return { d: 'M0 0', strokeOpacity: 0 };
    const ca = Math.sqrt(p.e * p.e + p.n * p.n);
    const L = Math.min(0.85, (GNOMON * ca) / p.u);
    const t = theta.value;
    return {
      d: `M${pt(project(0, 0, 0, t, R))}L${pt(project((-p.e / ca) * L, 0, (-p.n / ca) * L, t, R))}`,
      strokeOpacity: 0.55,
    };
  });

  const sunRay = useAnimatedProps(() => {
    const sc = scene.value;
    const p = sunAt(sc.hNow, sc);
    const t = theta.value;
    return {
      d: `M${pt(project(0, GNOMON, 0, t, R))}L${pt(project(p.e * 0.97, p.u * 0.97, p.n * 0.97, t, R))}`,
      strokeOpacity: p.u > 0 ? 0.45 : 0.12,
    };
  });

  const common: Common = { scene, theta, R, ox, oy };
  const below = model.stations.filter((s) => !s.above);
  const above = model.stations.filter((s) => s.above);
  const beadColor = (key: PrayerKey) => (key === nextKey ? colors.accent : colors.text);

  if (size <= 0) return null;

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Armillary sphere of today's sky. Next prayer: ${LABELS[nextKey]}. Drag sideways to turn it.`}
      style={{ width: size, height }}>
      {/* Layer 1 — beneath the horizon */}
      <Svg width={size} height={height} viewBox={`${-ox} ${-oy} ${size} ${height}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="falak-sky" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gold} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={`M${-R * 1.25} 0a${R * 1.25} ${R * 1.25} 0 1 0 ${R * 2.5} 0a${R * 1.25} ${R * 1.25} 0 1 0 ${-R * 2.5} 0`} fill="url(#falak-sky)" />
        <AnimatedPath animatedProps={meridianLower} stroke={colors.textSecondary} strokeOpacity={0.25} strokeWidth={0.8} fill="none" />
        <AnimatedPath animatedProps={axisDown} stroke={colors.textSecondary} strokeOpacity={0.3} strokeWidth={0.8} strokeDasharray="2 4" />
        <AnimatedPath animatedProps={nightProps} fill={colors.textSecondary} fillOpacity={0.22} />
        <AnimatedPath animatedProps={twilightProps} fill={colors.accent} fillOpacity={0.7} />
      </Svg>

      {below.map((s) => (
        <Bead key={s.key} {...common} H={s.H} size={s.key === nextKey ? 9 : 7} color={beadColor(s.key)} halo={s.key === nextKey ? colors.accent : undefined} />
      ))}
      {!model.sunAbove && <Bead {...common} H={null} size={9} color={gold} halo={gold} />}

      {/* Layer 2 — the horizon as frosted glass, then everything above it */}
      <Svg width={size} height={height} viewBox={`${-ox} ${-oy} ${size} ${height}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="falak-disk" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.surface} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={colors.surface} stopOpacity={0.85} />
          </RadialGradient>
        </Defs>
        <Path d={staticGeo.rim} fill="url(#falak-disk)" stroke={gold} strokeOpacity={0.55} strokeWidth={1.1} />
        <AnimatedPath animatedProps={ticks} stroke={gold} strokeOpacity={0.5} strokeWidth={0.9} />
        <AnimatedPath animatedProps={qiblaLine} stroke={gold} strokeOpacity={0.45} strokeWidth={0.9} strokeDasharray="1.5 3.5" />
        <AnimatedPath animatedProps={qiblaMark} fill={gold} />
        <AnimatedPath animatedProps={shadow} stroke={colors.text} strokeWidth={2} strokeLinecap="round" />
        <Path d={staticGeo.gnomon} stroke={colors.text} strokeWidth={1.6} strokeLinecap="round" />
        <AnimatedPath animatedProps={meridianUpper} stroke={colors.textSecondary} strokeOpacity={0.35} strokeWidth={0.8} fill="none" />
        <AnimatedPath animatedProps={axisUp} stroke={colors.textSecondary} strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="2 4" />
        <AnimatedPath animatedProps={sunRay} stroke={gold} strokeWidth={0.8} strokeDasharray="1 3" />
        <AnimatedPath animatedProps={dayProps} fill={gold} fillOpacity={0.92} />
      </Svg>

      {above.map((s) => (
        <Bead key={s.key} {...common} H={s.H} size={s.key === nextKey ? 9 : 7} color={beadColor(s.key)} halo={s.key === nextKey ? colors.accent : undefined} />
      ))}
      {model.sunAbove && <Bead {...common} H={null} size={12} color={gold} halo={gold} />}

      {/* Labels on top of everything, for legibility */}
      {model.stations.map((s) => (
        <BeadLabel
          key={s.key}
          {...common}
          H={s.H}
          text={LABELS[s.key]}
          color={s.key === nextKey ? colors.accent : colors.textSecondary}
        />
      ))}
      <HorizonLabel theta={theta} R={R} ox={ox} oy={oy} e={0} n={1} text="N" color={colors.textSecondary} />
      <HorizonLabel theta={theta} R={R} ox={ox} oy={oy} e={model.scene.qE} n={model.scene.qN} text="القبلة" color={gold} arabic />
    </View>
  );
}

export const Falak = memo(FalakScene);

const styles = StyleSheet.create({
  bead: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
