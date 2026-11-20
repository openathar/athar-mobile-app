import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celestial } from '@/components/celestial';
import { MeteorField } from '@/components/meteor-field';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { IS_RTL } from '@/lib/i18n';

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
  // Dev only, like `?at=HH:MM`: `?y=1200` opens the screen scrolled, for simulator screenshots.
  const { y } = useLocalSearchParams<{ y?: string }>();
  const scroller = useRef<any>(null);
  useEffect(() => {
    if (!__DEV__ || !y) return;
    const id = setTimeout(() => {
      const node = scroller.current;
      const target = node?.scrollTo ? node : node?.getNode?.();
      target?.scrollTo?.({ y: Number(y), animated: false });
    }, 900);
    return () => clearTimeout(id);
  }, [y]);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {starOpacity > 0 && (
        <Animated.View pointerEvents="none" style={[styles.stars, { opacity: Animated.multiply(fade, starOpacity) }]}>
          <MeteorField colors={colors.stars} />
        </Animated.View>
      )}
      <SafeAreaView style={styles.fill} edges={['top']}>
        {scroll ? (
          <Animated.ScrollView
            ref={scroller}
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
  celestial = true,
  style,
  titleAccent,
}: {
  title?: string;
  titleAr?: string;
  /** A Latin line in the accent colour where the Arabic title would be (Today's Hijri date outside the Arabic UI). */
  titleAccent?: string;
  subtitle?: string;
  subtitleLines?: number;
  /** The small sun/moon in the corner. Off where a large moon already carries the screen. */
  celestial?: boolean;
  /** Extra spacing for one screen (Today sets the header lower, away from its moon). */
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = usePhase();
  return (
    <View style={[styles.header, style]}>
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
          {titleAccent ? (
            <Text style={[styles.titleAccent, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{titleAccent}</Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text numberOfLines={subtitleLines} style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {celestial ? (
        <View style={styles.celestial}>
          <Celestial size={104} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Header for the modal screens (location, calculation method): the same
 * title/twin/subtitle rhythm as ScreenHeader, with a close mark instead of
 * the sun or moon.
 */
export function ModalHeader({
  title,
  titleAr,
  subtitle,
  subtitleLines = 3,
}: {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleLines?: number;
}) {
  const { colors } = usePhase();
  return (
    <View style={styles.modalHeader}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          {title ? (
            <Text style={[styles.titleCompact, { color: colors.text, fontFamily: Fonts.display }]}>{title}</Text>
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
          <Text
            numberOfLines={subtitleLines}
            style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => [styles.close, { borderColor: colors.rule }, pressed && styles.pressed]}>
        <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * A chapter opener, as on openathar.org: a small mono line "01 · Name" and the
 * chapter's sentence set large and light under it. Arabic gets Arabic-Indic
 * digits and Amiri, like the website's `lp-chap-n`.
 */
export function ChapterHead({ n, name, title }: { n: number; name: string; title?: string }) {
  const arabic = IS_RTL;
  const { colors } = usePhase();
  const nn = String(n).padStart(2, '0');
  const label = arabic ? nn.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : nn;
  return (
    <View style={styles.chapter}>
      <Text style={[styles.chapterN, { color: colors.accent, fontFamily: arabic ? Fonts.arabic : Fonts.mono }]}>
        {label} · {name}
      </Text>
      {title ? (
        <Text style={[arabic ? styles.chapterTitleAr : styles.chapterTitle, { color: colors.text, fontFamily: arabic ? Fonts.arabic : Fonts.display }]}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Section label: plain sentence case, quiet. With `n` it becomes a chapter
 * line like the website's ("01 · Calculation"): mono number, gold, the label
 * after it — so a long screen reads as numbered chapters.
 */
export function SectionLabel({ children, n }: { children: ReactNode; n?: number }) {
  const { colors } = usePhase();
  if (n == null) {
    return <Text style={[styles.section, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{children}</Text>;
  }
  const nn = String(n).padStart(2, '0');
  return (
    <Text style={[styles.section, styles.sectionChapter, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
      <Text style={{ fontFamily: Fonts.mono }}>{IS_RTL ? nn.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : nn} · </Text>
      {children}
    </Text>
  );
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.6,
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
  // The disc may bleed into the right margin, but never above the header:
  // the sun and moon are real spheres here, a clipped top reads as a bug.
  celestial: {
    marginVertical: -4,
    marginRight: -10,
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
  // Modal titles carry a sentence ("Calculation method"), so they are set one
  // step smaller — at 34 the twin Arabic slides onto its own line.
  titleCompact: {
    fontSize: 28,
    lineHeight: 36,
  },
  titleArPrimary: {
    fontSize: 26,
    lineHeight: 38,
  },
  titleAccent: {
    fontSize: 22,
    lineHeight: 32,
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
  sectionChapter: {
    marginTop: 44,
    marginBottom: 10,
  },
  chapter: {
    marginTop: 44,
    marginBottom: 14,
    gap: 6,
  },
  chapterN: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  chapterTitle: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  chapterTitleAr: {
    fontSize: 28,
    lineHeight: 46,
  },
  card: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
