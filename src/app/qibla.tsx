import { qiblaBearing } from '@openathar/athan-core-ts';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { Khatam } from '@/components/khatam';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';

const COMPASS = 280;

export default function QiblaScreen() {
  const { location } = useLocation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const bearing = Math.round(qiblaBearing(location.lat, location.lng));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>Qibla</Text>
        <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          from {location.label}
        </Text>

        <View style={styles.compassWrap}>
          <Svg width={COMPASS} height={COMPASS} viewBox="-140 -140 280 280">
            <Circle r={130} stroke={colors.rule} strokeWidth={1} fill="none" />
            {[
              { deg: 0, label: 'N' },
              { deg: 90, label: 'E' },
              { deg: 180, label: 'S' },
              { deg: 270, label: 'W' },
            ].map(({ deg, label }) => (
              <G key={deg} rotation={deg}>
                <Line x1={0} y1={-130} x2={0} y2={-120} stroke={colors.textSecondary} strokeWidth={2} />
                <SvgText
                  x={0}
                  y={-104}
                  textAnchor="middle"
                  fill={colors.textSecondary}
                  fontSize={13}
                  fontFamily={Fonts.sansMedium}>
                  {label}
                </SvgText>
              </G>
            ))}
            {/* Nadel: zeigt auf die Qibla-Richtung (vom Norden aus im Uhrzeigersinn) */}
            <G rotation={bearing}>
              <Line x1={0} y1={-118} x2={0} y2={0} stroke={colors.accent} strokeWidth={3} strokeLinecap="round" />
              <Line x1={0} y1={0} x2={0} y2={28} stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" />
            </G>
          </Svg>
          <View style={styles.khatamCenter} pointerEvents="none">
            <Khatam size={64} color={colors.accent} opacity={0.9} duration={120000} />
          </View>
        </View>

        <View style={styles.bearingBox}>
          <Text style={[styles.bearing, { color: colors.text, fontFamily: Fonts.monoMedium }]}>
            {bearing}°
          </Text>
          <Text style={[styles.caption, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            from true north
          </Text>
        </View>

        <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          Compass (magnetometer) comes with the location feature.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  sub: {
    fontSize: 14,
    marginTop: Spacing.one,
  },
  compassWrap: {
    marginTop: Spacing.five,
    width: COMPASS,
    height: COMPASS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  khatamCenter: {
    position: 'absolute',
    width: 64,
    height: 64,
  },
  bearingBox: {
    marginTop: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  bearing: {
    fontSize: 56,
    lineHeight: 64,
  },
  caption: {
    fontSize: 14,
  },
  note: {
    marginTop: Spacing.four,
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.85,
  },
});