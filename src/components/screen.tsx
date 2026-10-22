import { useRef, type ReactNode } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celestial } from '@/components/celestial';
import { StarField } from '@/components/star-field';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';

/**
 * Every screen's frame: one flat colour that follows the sun (night navy,
 * day paper — the same two themes as openathar.org), stars that fade out as
 * it gets light, and a scroll container. One component so no screen can
 * drift into its own palette or forget to scroll again. No gradient, no
 * vignette, no glow.
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
  const { colors, starOpacity } = usePhase();
  // The stars belong to the top of the page: they fade as you scroll away from it.
  const scrollY = useRef(new Animated.Value(0)).current;
  const fade = scrollY.interpolate({ inputRange: [0, 240], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {starOpacity > 0 && (
        <Animated.View pointerEvents="none" style={[styles.stars, { opacity: Animated.multiply(fade, starOpacity) }]}>
          <StarField colors={colors.stars} />
        </Animated.View>
      )}
      <SafeAreaView style={styles.fill} edges={['top']}>
        {scroll ? (
          <Animated.ScrollView
            style={styles.fill}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {children}
          </Animated.ScrollView>
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
  subtitleLines = 1,
}: {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleLines?: number;
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
          <Text numberOfLines={subtitleLines} style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
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

/** Section label: plain sentence case, quiet, like the landing page's list headers. */
export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors } = usePhase();
  return <Text style={[styles.section, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{children}</Text>;
}

/**
 * A list block: hairline above and below, no box, no radius, no tint — rows
 * sit directly on the page like the landing page's lists.
 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = usePhase();
  return (
    <View style={[styles.card, { borderColor: colors.rule }, style]}>
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
  // Stars only over the upper part (header and sphere), like the landing page's
  // moon canvas — never behind the text.
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
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
    fontSize: 34,
    lineHeight: 42,
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
    fontSize: 14,
    marginTop: 32,
    marginBottom: 6,
  },
  card: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
