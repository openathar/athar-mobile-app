import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';

import { Celestial, SkyLight } from '@/components/celestial';
import { StarField } from '@/components/star-field';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { mixHex, withAlpha } from '@/lib/color';

/**
 * Every screen's frame: the real sky for this moment (computed from the
 * sun's altitude, so it moves continuously through dawn, day and dusk), the
 * light of the sun, stars that fade out as it gets light, and a scroll
 * container. One component so no screen can drift into its own palette or
 * forget to scroll again.
 */
export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors, sky, starOpacity } = usePhase();
  const { width, height } = useWindowDimensions();

  // A little atmospheric depth: a warm haze band low over the horizon (real
  // skies aren't a flat two-stop blend near the ground), plus a soft
  // vignette so the frame doesn't read as a flat rectangle of colour.
  const [zenith, horizon] = sky;
  const haze = mixHex(horizon, '#fff3d6', 0.14);

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[zenith, horizon, haze]}
        locations={[0, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgRadialGradient id="vignette" cx="50%" cy="38%" r="75%">
            <Stop offset="55%" stopColor="#000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000" stopOpacity={0.22} />
          </SvgRadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
      </Svg>
      <SkyLight width={width} />
      {starOpacity > 0 && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: starOpacity }]}>
          <StarField colors={colors.stars} />
        </View>
      )}
      <SafeAreaView style={styles.fill} edges={['top']}>
        {scroll ? (
          <ScrollView
            style={styles.fill}
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, styles.content, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

/**
 * The shared header: Latin title with its Arabic twin, a quiet subtitle, and
 * the sun or moon on the right — the same sky on every screen.
 */
export function ScreenHeader({
  title,
  titleAr,
  subtitle,
}: {
  title?: string;
  titleAr?: string;
  subtitle?: string;
}) {
  const { colors } = usePhase();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          {title ? (
            <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>{title}</Text>
          ) : null}
          {titleAr ? (
            <Text
              style={[
                title ? styles.titleArSecondary : styles.titleArPrimary,
                { color: colors.accent, fontFamily: title ? Fonts.arabic : Fonts.arabicBold },
              ]}>
              {titleAr}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.celestial}>
        <Celestial size={104} />
      </View>
    </View>
  );
}

/** Section label in the website's voice: `// label`. */
export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors } = usePhase();
  return (
    <Text style={[styles.section, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
      <Text style={{ color: colors.rule }}>{'// '}</Text>
      {children}
    </Text>
  );
}

/** Frosted surface: the phase's surface colour, a hairline edge, generous radius. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = usePhase();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: withAlpha(colors.surface, 0.86), borderColor: withAlpha(colors.rule, 0.9) },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Hairline divider between rows inside a Card. */
export function Divider() {
  const { colors } = usePhase();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.rule }} />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    // Clear the floating tab bar.
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  // The halo/corona extends past the body; let it bleed into the margins
  // instead of pushing the header taller.
  celestial: {
    marginVertical: -18,
    marginRight: -14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleArPrimary: {
    fontSize: 26,
    lineHeight: 38,
  },
  titleArSecondary: {
    fontSize: 24,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 13,
  },
  section: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'lowercase',
    marginTop: 26,
    marginBottom: 10,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
});
