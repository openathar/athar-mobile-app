import { qiblaBearing } from '@openathar/athan-core-ts';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Earth } from '@/components/earth';
import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useLocation } from '@/hooks/use-location';
import { midLongitude } from '@/lib/globe';
import { distanceKm } from '@/lib/geo';
import { IS_RTL, LOCALE, t } from '@/lib/i18n';

const KAABA = { lat: 21.4225241, lng: 39.8261818 };
/** Within this many degrees the phone counts as facing the Qibla. */
const ALIGNED_DEG = 4;

const WINDS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Signed shortest turn from a to b, in −180..180. */
function shortest(a: number, b: number): number {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

/**
 * Device heading, preferring true north: the Qibla bearing is computed from
 * true north, so turning by the magnetic heading would be off by the local
 * magnetic declination (3–5° in Jordan or Germany, far more elsewhere).
 * Readings are low-pass filtered on the circle, so the dial doesn't jitter
 * and never takes the long way round through 0°/360°.
 */
function useHeading() {
  const [heading, setHeading] = useState<{ deg: number; source: 'true' | 'magnetic' } | null>(null);
  const smooth = useRef<number | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const hasTrue = h.trueHeading >= 0;
      const raw = hasTrue ? h.trueHeading : h.magHeading;
      const prev = smooth.current;
      const next = prev === null ? raw : (prev + shortest(prev, raw) * 0.25 + 360) % 360;
      smooth.current = next;
      setHeading({ deg: next, source: hasTrue ? 'true' : 'magnetic' });
    }).then(
      (s) => {
        if (cancelled) s.remove();
        else sub = s;
      },
      () => {}
    );
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);
  return heading;
}

/**
 * The compass ring around the Earth. The ring turns with the phone (north
 * stays north); the gold arrow points to the Qibla and snaps to the top mark
 * when you face it. On the web, with no sensor, the ring stands still.
 */
function Ring({ size, bearing, heading, aligned }: { size: number; bearing: number; heading: number | null; aligned: boolean }) {
  const { colors } = usePhase();
  const V = size / 2;
  const R = V - 14;
  const rot = heading === null ? 0 : -heading;
  const ticks = useMemo(() => {
    let d = '';
    for (let i = 0; i < 72; i++) {
      const long = i % 6 === 0;
      const [x1, y1] = polar(R, i * 5);
      const [x2, y2] = polar(R - (long ? 9 : 4), i * 5);
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  }, [R]);
  const arrowDeg = bearing + rot; // where the Qibla is, on the screen
  const [ax, ay] = polar(R + 4, arrowDeg);
  const [bx, by] = polar(R - 16, arrowDeg);
  return (
    <Svg width={size} height={size} viewBox={`${-V} ${-V} ${size} ${size}`} style={StyleSheet.absoluteFill} pointerEvents="none">
      <G rotation={rot}>
        <Circle r={R} fill="none" stroke={colors.rule} strokeWidth={1} />
        <Path d={ticks} stroke={colors.textSecondary} strokeOpacity={0.55} strokeWidth={1} />
        {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([l, d]) => {
          const [x, y] = polar(R - 26, d as number);
          return (
            <SvgText key={l} x={x} y={y + 5} fontSize={14} fontFamily={Fonts.sansMedium} fill={l === 'N' ? colors.accent : colors.textSecondary} textAnchor="middle" transform={`rotate(${-rot} ${x} ${y})`}>
              {l}
            </SvgText>
          );
        })}
      </G>
      <Path d={`M${ax} ${ay}L${bx} ${by}`} stroke={colors.accent} strokeWidth={aligned ? 5 : 3} strokeLinecap="round" />
      <Circle cx={ax} cy={ay} r={aligned ? 7 : 5} fill={colors.accent} />
      <Path d={`M0 ${-R - 8}L0 ${-R + 10}`} stroke={aligned ? colors.accent : colors.text} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function QiblaScreen() {
  const { location } = useLocation();
  const { colors } = usePhase();
  const { width } = useWindowDimensions();
  const heading = useHeading();
  const [spin, setSpin] = useState(0);

  const bearing = qiblaBearing(location.lat, location.lng);
  const km = distanceKm(location, KAABA);
  const wind = WINDS[Math.round(bearing / 22.5) % 16];
  const ring = Math.max(0, Math.min(width - 24, 400));
  const globe = Math.round(ring * 0.72);
  const aligned = heading !== null && Math.abs(shortest(heading.deg, bearing)) <= ALIGNED_DEG;
  // Turn the Earth so that you and the Kaaba both face the viewer.
  const centre = midLongitude(location.lng, KAABA.lng) + spin;

  let guidance: string;
  if (heading === null) {
    guidance = Platform.OS === 'web' ? t.kaabaLies(Math.round(bearing)) : t.holdFlat;
  } else {
    const turn = shortest(heading.deg, bearing);
    guidance = aligned ? t.facing : turn > 0 ? t.turnRight(Math.round(Math.abs(turn))) : t.turnLeft(Math.round(Math.abs(turn)));
  }

  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.qiblaTitle} titleAr="القبلة" subtitle={`${t.from} ${location.label}`} />

      <View style={styles.stage}>
        <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
          <Ring size={ring} bearing={bearing} heading={heading?.deg ?? null} aligned={aligned} />
          <Earth
            size={globe}
            centralLon={centre}
            decl={0}
            side="plain"
            pins={[
              { lat: location.lat, lon: location.lng, color: colors.accent, size: 4.5, ring: true },
              { lat: KAABA.lat, lon: KAABA.lng, color: '#f4efe2', size: 5.5, ring: true },
            ]}
            arc={[{ lat: location.lat, lon: location.lng }, { lat: KAABA.lat, lon: KAABA.lng }]}
            arcColor={colors.accent}
            onSpin={(d) => setSpin((v) => v + d)}
          />
        </View>
      </View>

      <Text style={[styles.guidance, { color: aligned ? colors.accent : colors.text, fontFamily: aligned ? Fonts.sansSemiBold : Fonts.sansMedium }]}>{guidance}</Text>

      <SectionLabel>{t.direction}</SectionLabel>
      <Card>
        <View style={styles.readout}>
          <View>
            <Text style={[styles.big, { color: colors.text, fontFamily: Fonts.monoMedium }]}>{Math.round(bearing)}°</Text>
            <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              {wind} · {t.fromNorth}
            </Text>
          </View>
          <View style={styles.readoutRight}>
            <Text style={[styles.big, { color: colors.text, fontFamily: Fonts.monoMedium }]}>{Math.round(km).toLocaleString()}</Text>
            <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.kmToKaaba}</Text>
          </View>
        </View>
        {heading && (
          <>
            <Divider />
            <View style={styles.sensorRow}>
              <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                {t.heading} {Math.round(heading.deg)}°
              </Text>
              <Text style={[styles.small, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{heading.source === 'true' ? t.trueNorth : t.magnetic}</Text>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', marginTop: 8 },
  guidance: { textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 14, paddingHorizontal: 12 },
  readout: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  readoutRight: { alignItems: 'flex-end' },
  big: { fontSize: 30, lineHeight: 36 },
  small: { fontSize: 12 },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
});
