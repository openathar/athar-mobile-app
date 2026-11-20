import { Canvas, Fill, FilterMode, ImageShader, MipmapMode, Shader, Skia, useImage, type SkImage, type SkRuntimeEffect } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-motion';

/*
 * The Earth and the Moon as real, live-lit spheres.
 *
 * They used to be pre-rendered frames (a sprite sheet of 36 to 64 pictures) that the app crossfaded:
 * soft because each picture was a few hundred pixels, and never really turning, only blending
 * between neighbours. Here the planet is drawn by a Skia shader straight from the website's own
 * 2048 px textures: the surface is sampled per pixel, so it is as sharp as the screen allows and
 * every angle is a true angle. The rotation, the drag and the lighting are uniforms driven from the
 * UI thread.
 *
 * Both shaders place a pixel of the disc on the sphere the same way: take the view-space normal,
 * undo the axis lean and the central longitude, convert to latitude/longitude, look the colour up
 * in the equirectangular map.
 */

const COMMON = `
const float PI = 3.14159265359;
`;

// ---------------------------------------------------------------------------------------------
// Earth. `mode` 0: evenly lit (the Qibla map, any meridian); 1: day/night with city lights.
// ---------------------------------------------------------------------------------------------
const EARTH_SRC = `
uniform shader day;
uniform shader night;
uniform float2 texSize;
uniform float size;
uniform float lon0;   // central meridian, radians
uniform float lean;   // axis lean toward the sun, radians
uniform float sunSide; // +1 sun on the right, -1 on the left
uniform float mode;
${COMMON}
half4 main(float2 xy) {
  float R = size * 0.5;
  float2 p = (xy - R) / R;
  float r2 = dot(p, p);
  if (r2 > 1.0) return half4(0.0);
  float nz = sqrt(1.0 - r2);
  float nx = p.x;
  float ny = -p.y;
  float ca = cos(lean);
  float sa = sin(lean);
  float s = nx * sa + ny * ca;
  float u = nx * ca - ny * sa;
  float lat = asin(clamp(s, -1.0, 1.0));
  float lon = atan(u, nz) + lon0;
  float2 uv = float2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI);
  float2 tc = float2(uv.x * texSize.x, clamp(uv.y, 0.0, 0.9999) * texSize.y);
  float3 d = float3(day.eval(tc).rgb);
  float3 col;
  float rim;
  if (mode < 0.5) {
    float sh = 0.5 + 0.5 * max(0.0, -0.3 * nx + 0.5 * ny + 0.82 * nz);
    rim = pow(1.0 - nz, 3.2) * 0.45 * 0.5;
    col = d * sh + float3(90.0, 150.0, 255.0) / 255.0 * rim;
  } else {
    float sux = nx * sunSide;
    float lit = smoothstep(-0.12, 0.30, sux);
    float darkW = 1.0 - smoothstep(-0.30, 0.04, sux);
    float shade = 0.16 + 0.95 * pow(max(0.0, sux), 0.8);
    float3 dc = d * shade;
    float3 lights = float3(night.eval(tc).rgb) * 1.5 * darkW;
    float3 nc = d * float3(0.025, 0.035, 0.06) + lights;
    float warm = smoothstep(-0.14, 0.0, sux) * (1.0 - smoothstep(0.0, 0.16, sux)) * 0.06;
    rim = pow(1.0 - nz, 3.2) * (0.12 + 0.88 * smoothstep(-0.3, 0.6, sux));
    col = dc * lit + nc * (1.0 - lit) + float3(255.0, 120.0, 40.0) / 255.0 * warm * 0.4 + float3(90.0, 150.0, 255.0) / 255.0 * rim * 0.55;
  }
  float edge = clamp((1.0 - sqrt(r2)) * R, 0.0, 1.0);
  return half4(half3(clamp(col, 0.0, 1.0) * edge), half(edge));
}
`;

// ---------------------------------------------------------------------------------------------
// Moon, lit like the website's hero (web/components/lp/moon-stage.tsx): warm directional light
// 2.3, blue earthshine (emissive #7f93b4 x texture x 0.14), ambient 0.04, ACES tone mapping.
// The surface turns under the light (lon0/lat0); the light stays where the phase puts it.
// ---------------------------------------------------------------------------------------------
const MOON_SRC = `
uniform shader tex;
uniform float2 texSize;
uniform float size;
uniform float lon0;
uniform float lat0;
uniform float3 sun;   // direction toward the sun, view space (x right, y up, z toward the viewer)
${COMMON}
float3 aces(float3 c) {
  float3x3 inM = float3x3(float3(0.59719, 0.07600, 0.02840), float3(0.35458, 0.90834, 0.13383), float3(0.04823, 0.01566, 0.83777));
  float3x3 outM = float3x3(float3(1.60475, -0.10208, -0.00327), float3(-0.53108, 1.10813, -0.07276), float3(-0.07367, -0.00605, 1.07602));
  float3 v = inM * (c / 0.6);
  float3 a = v * (v + 0.0245786) - 0.000090537;
  float3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(outM * (a / b), 0.0, 1.0);
}
half4 main(float2 xy) {
  float R = size * 0.5;
  float2 p = (xy - R) / R;
  float r2 = dot(p, p);
  if (r2 > 1.0) return half4(0.0);
  float nz = sqrt(1.0 - r2);
  float3 n = float3(p.x, -p.y, nz);
  // surface point in moon coordinates: tilt about x, turn about y
  float cp = cos(lat0);
  float sp = sin(lat0);
  float3 a = float3(n.x, n.y * cp + n.z * sp, -n.y * sp + n.z * cp);
  float cl = cos(lon0);
  float sl = sin(lon0);
  float3 b = float3(a.x * cl + a.z * sl, a.y, -a.x * sl + a.z * cl);
  float lat = asin(clamp(b.y, -1.0, 1.0));
  float lon = atan(b.x, b.z);
  float2 tc = float2(fract(lon / (2.0 * PI) + 0.5) * texSize.x, clamp(0.5 - lat / PI, 0.0, 0.9999) * texSize.y);
  float3 alb = pow(float3(tex.eval(tc).rgb), float3(2.2));
  float ndl = max(0.0, dot(n, normalize(sun)));
  float3 warm = float3(1.0, 0.924, 0.813);
  float3 emissive = float3(0.2163, 0.3, 0.4647);
  float3 lin = alb * (2.3 / PI * ndl * warm + 0.14 * emissive + 0.04 / PI);
  float3 m = aces(lin);
  float3 srgb = mix(m * 12.92, 1.055 * pow(m, float3(1.0 / 2.4)) - 0.055, step(0.0031308, m));
  float edge = clamp((1.0 - sqrt(r2)) * R, 0.0, 1.0);
  return half4(half3(srgb * edge), half(edge));
}
`;

// Compiled on first use, not at import: on web CanvasKit is only there after LoadSkiaWeb()
// (see app/_layout.tsx), and static rendering imports this module on the server.
let earthCache: SkRuntimeEffect | null | undefined;
let moonCache: SkRuntimeEffect | null | undefined;
const earthEffectOnce = () => (earthCache === undefined ? (earthCache = Skia.RuntimeEffect.Make(EARTH_SRC)) : earthCache);
const moonEffectOnce = () => (moonCache === undefined ? (moonCache = Skia.RuntimeEffect.Make(MOON_SRC)) : moonCache);

const DAY: number = require('../../assets/images/textures/2k_earth_daymap.jpg');
const NIGHT: number = require('../../assets/images/textures/2k_earth_nightmap.jpg');
const MOON: number = require('../../assets/images/textures/2k_moon.jpg');

const LINEAR = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
const DEG = Math.PI / 180;
const size2 = (img: SkImage) => [img.width(), img.height()];

/**
 * The Earth. `lon` is the central meridian in degrees (what faces the viewer), as a shared value so
 * dragging and the clock turn it on the UI thread. `lean` is the axis lean toward the sun in degrees.
 * `side` 'plain' = evenly lit for the Qibla map; 'right'/'left' = day/night line with city lights.
 */
export function EarthSphere({
  size,
  lon,
  lean,
  side,
}: {
  size: number;
  lon: SharedValue<number>;
  lean: number;
  side: 'right' | 'left' | 'plain';
}) {
  const day = useImage(DAY);
  const night = useImage(NIGHT);
  // Plain numbers, read on the render thread: the worklet below runs on the UI thread, where the
  // image object's methods and `size2` do not exist.
  const texSize = day ? size2(day) : [1, 1];
  const uniforms = useDerivedValue(() => ({
    texSize,
    size,
    lon0: lon.value * DEG,
    lean: lean * DEG,
    sunSide: side === 'left' ? -1 : 1,
    mode: side === 'plain' ? 0 : 1,
  }));
  const earthEffect = earthEffectOnce();
  if (!earthEffect || !day || !night) return null;
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Fill>
        <Shader source={earthEffect} uniforms={uniforms}>
          <ImageShader image={day} tx="repeat" ty="clamp" sampling={LINEAR} />
          <ImageShader image={night} tx="repeat" ty="clamp" sampling={LINEAR} />
        </Shader>
      </Fill>
    </Canvas>
  );
}

/** One turn of the moon in seconds: the website's moon turns 0.02 rad/s. */
const MOON_TURN_SECONDS = (2 * Math.PI) / 0.02;

/**
 * The Moon. `fraction` is the lunation fraction 0..1 (0 new, 0.5 full, waxing lit on the right) as a
 * shared value; `spin` turns the surface under the light like the website's moon does.
 */
export function MoonSphere({
  size,
  fraction,
  spin = true,
  drag,
}: {
  size: number;
  fraction: SharedValue<number>;
  spin?: boolean;
  /** Extra turn in radians from a finger (BigMoon), added to the slow spin. */
  drag?: SharedValue<number>;
}) {
  const img = useImage(MOON);
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (!spin || reduced) return;
    turn.value = withRepeat(withTiming(2 * Math.PI, { duration: MOON_TURN_SECONDS * 1000, easing: Easing.linear }), -1, false);
    return () => {
      turn.value = 0;
    };
  }, [spin, reduced, turn]);

  const texSize = img ? size2(img) : [1, 1];
  const uniforms = useDerivedValue(() => {
    const a = fraction.value * 2 * Math.PI; // phase angle: 0 new, π full
    return {
      texSize,
      size,
      lon0: turn.value + (drag ? drag.value : 0),
      lat0: 0.1,
      // The sun in view space: right for the first quarter, toward the viewer for the full moon.
      sun: [Math.sin(a), 0.075, -Math.cos(a)],
    };
  });
  const moonEffect = moonEffectOnce();
  if (!moonEffect || !img) return null;
  return (
    <Canvas style={{ width: size, height: size }} pointerEvents="none">
      <Fill>
        <Shader source={moonEffect} uniforms={uniforms}>
          <ImageShader image={img} tx="repeat" ty="clamp" sampling={LINEAR} />
        </Shader>
      </Fill>
    </Canvas>
  );
}
