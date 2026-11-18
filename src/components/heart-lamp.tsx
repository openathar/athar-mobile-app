import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);

import { Card, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { CONTENT_LOCALE, IS_RTL, LOCALE, t } from '@/lib/i18n';

/**
 * "The Lamp of the Heart" (مصباح القلب) — after Ayat an-Nur (24:35):
 * "Allah is the Light of the heavens and the earth. The example of His light
 * is like a niche within which is a lamp..."
 *
 * The heart is the niche (mishkat); the feeling you tap is the oil that feeds
 * or starves the flame. Positive feelings (love, trust, peace) make it burn
 * steady and warm; their counterparts (hatred, fear, sadness) make it flicker
 * and dim. The flame lives on the UI thread and breathes on its own.
 */

type Feeling = { key: string; ar: string; en: string; de: string; verse: string; warm: boolean };

const FEELINGS: Feeling[] = [
  { key: 'love', ar: 'حب', en: 'Love', de: 'Liebe', verse: 'Q 30:21 — He placed between you affection and mercy.', warm: true },
  { key: 'trust', ar: 'ثقة', en: 'Trust', de: 'Vertrauen', verse: 'Q 3:173 — Allah is sufficient for us.', warm: true },
  { key: 'peace', ar: 'طمأنينة', en: 'Peace', de: 'Frieden', verse: 'Q 13:28 — In the remembrance of Allah hearts find rest.', warm: true },
  { key: 'hope', ar: 'رجاء', en: 'Hope', de: 'Hoffnung', verse: 'Q 12:87 — Do not despair of the mercy of Allah.', warm: true },
  { key: 'hatred', ar: 'بغض', en: 'Hatred', de: 'Hass', verse: 'Q 5:8 — Do not let hatred lead you to injustice.', warm: false },
  { key: 'fear', ar: 'خوف', en: 'Fear', de: 'Angst', verse: 'Q 2:38 — Those who follow My guidance shall have no fear.', warm: false },
  { key: 'sadness', ar: 'حزن', en: 'Sadness', de: 'Trauer', verse: 'Q 9:40 — Allah is with us.', warm: false },
  { key: 'anxiety', ar: 'قلق', en: 'Anxiety', de: 'Sorge', verse: 'Q 2:286 — Allah does not burden a soul beyond its capacity.', warm: false },
];

const nameOf = (f: Feeling) => (CONTENT_LOCALE === 'ar' ? f.ar : CONTENT_LOCALE === 'de' ? f.de : f.en);

export function HeartLamp() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const reduced = useReducedMotion();
  const [sel, setSel] = useState<string>('love');
  const cur = FEELINGS.find((f) => f.key === sel)!;

  // The flame breathes on its own; tapping a feeling shifts its colour and steadiness.
  const breathe = useSharedValue(0);
  const intensity = useSharedValue(1); // 1 = full warm flame, 0 = dim
  useEffect(() => {
    if (reduced) { breathe.value = 0.5; return; }
    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, breathe]);
  useEffect(() => {
    intensity.value = withTiming(cur.warm ? 1 : 0.35, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [cur, intensity]);

  const flameProps = useAnimatedProps(() => ({
    opacity: 0.7 + 0.3 * intensity.value,
    transform: [{ scale: 1 + 0.06 * breathe.value }],
  }));

  const size = Math.min(width - 40, 300);
  const cx = size / 2;
  const cy = size * 0.42;

  // Place feelings on a circle around the lamp.
  const radius = size * 0.42;
  const positions = FEELINGS.map((f, i) => {
    const angle = (i / FEELINGS.length) * 2 * Math.PI - Math.PI / 2;
    return { f, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });

  return (
    <View>
      <SectionLabel>{t.heartLampTitle}</SectionLabel>
      <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartLampLead}</Text>

      <View style={[styles.stage, { width: size, height: size + 40 }]}>
        <Svg width={size} height={size + 40} viewBox={`0 0 ${size} ${size + 40}`}>
          <Defs>
            <RadialGradient id="lamp-glow" cx="0.5" cy="0.4" r="0.5">
              <Stop offset="0" stopColor={cur.warm ? '#ffd98a' : '#9aa0b0'} stopOpacity="0.35" />
              <Stop offset="0.6" stopColor={cur.warm ? '#d4a95f' : '#5c6156'} stopOpacity="0.12" />
              <Stop offset="1" stopColor={cur.warm ? '#d4a95f' : '#5c6156'} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="flame-core" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#fff3d6" stopOpacity="1" />
              <Stop offset="0.4" stopColor={cur.warm ? '#f5c66e' : '#9aa0b0'} stopOpacity="0.8" />
              <Stop offset="1" stopColor={cur.warm ? '#d4a95f' : '#5c6156'} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* The niche (mishkat) — an arched alcove */}
          <Path d={`M${cx - 46} ${cy + 52} L${cx - 46} ${cy - 20} Q${cx - 46} ${cy - 72} ${cx} ${cy - 80} Q${cx + 46} ${cy - 72} ${cx + 46} ${cy - 20} L${cx + 46} ${cy + 52} Z`}
            fill={colors.background} stroke={colors.rule} strokeWidth="1.5" />

          {/* The lamp's glow */}
          <Circle cx={cx} cy={cy} r={70} fill="url(#lamp-glow)" />

          {/* The lamp body (small oil vessel) */}
          <Ellipse cx={cx} cy={cy + 18} rx={22} ry={10} fill={colors.rule} stroke={colors.accent} strokeWidth="1" />
          <Path d={`M${cx - 22} ${cy + 18} Q${cx - 26} ${cy + 30} ${cx - 18} ${cy + 36} L${cx + 18} ${cy + 36} Q${cx + 26} ${cy + 30} ${cx + 22} ${cy + 18} Z`}
            fill={colors.background} stroke={colors.rule} strokeWidth="1" />

          {/* The flame */}
          <AnimatedPath animatedProps={flameProps} d={`M${cx} ${cy - 40} Q${cx - 10} ${cy - 20} ${cx - 6} ${cy - 4} Q${cx} ${cy + 4} ${cx + 6} ${cy - 4} Q${cx + 10} ${cy - 20} ${cx} ${cy - 40} Z`}
            fill="url(#flame-core)" origin={`${cx}, ${cy - 8}`} />

          {/* Feeling points on the circle */}
          {positions.map(({ f, x, y }) => {
            const on = f.key === sel;
            const r = on ? 9 : 5;
            const col = on ? colors.accent : (f.warm ? colors.accent : colors.textSecondary);
            return (
              <G key={f.key}>
                <Circle cx={x} cy={y} r={r + 4} fill={col} fillOpacity={on ? 0.18 : 0} />
                <Circle cx={x} cy={y} r={r} fill={col} fillOpacity={on ? 1 : 0.5} />
              </G>
            );
          })}
        </Svg>

        {/* Tap targets over the feeling points */}
        {positions.map(({ f, x, y }) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            accessibilityLabel={nameOf(f)}
            onPress={() => setSel(f.key)}
            style={[styles.hit, { left: x - 20, top: y - 20 }]}
          />
        ))}
      </View>

      {/* Selected feeling */}
      <View style={[styles.sheet, { borderTopColor: colors.rule }]}>
        <Text style={[styles.name, { color: colors.text, fontFamily: Fonts.display }]}>{nameOf(cur)}</Text>
        <Text style={[styles.ar, { color: colors.text, fontFamily: Fonts.arabic }]}>{cur.ar}</Text>
        <Text style={[styles.verse, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{cur.verse}</Text>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartLampBody[cur.key as keyof typeof t.heartLampBody]}</Text>
      </View>

      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartLampSource}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 12 },
  stage: { alignSelf: 'center', position: 'relative' },
  hit: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  sheet: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 8, marginTop: 8 },
  name: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  ar: { fontSize: 26, lineHeight: 40 },
  verse: { fontSize: 14, lineHeight: 20, marginTop: 4, fontStyle: 'italic' },
  body: { fontSize: 16, lineHeight: 24, marginTop: 8 },
  source: { fontSize: 13, lineHeight: 19, marginTop: 12 },
});
