import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { Card, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { CONTENT_LOCALE, IS_RTL, LOCALE, t } from '@/lib/i18n';

import labelsData from '@/data/labels.json';

/**
 * "The Heart's Atlas" (أطلس القلب) — after Ayat an-Nur (24:35).
 *
 * A lamp (misbah) in a niche (mishkat) at the top, whose flame responds to
 * the feeling you tap. Below it, all 199 feelings from Amin Sabry's research
 * map (alhosna.net) are listed — searchable, grouped by body zone (chest,
 * belly, core, face). Each tap lights the flame and reveals a verse.
 */

type Label = { id: string; text: string; zone: 'chest' | 'belly' | 'core' | 'face' };

const LABELS: Label[] = labelsData as Label[];

const ZONE_COLOR: Record<string, string> = {
  chest: '#d4a95f',
  belly: '#4aa583',
  core: '#9a6f1f',
  face: '#98a0b0',
};

const ZONE_NAME: Record<string, Record<string, string>> = {
  chest: { en: 'Chest', de: 'Brust', ar: 'الصدر', pl: 'Pierś', tr: 'Göğüs' },
  belly: { en: 'Belly', de: 'Bauch', ar: 'البطن', pl: 'Brzuch', tr: 'Karın' },
  core: { en: 'Core', de: 'Kern', ar: 'المركز', pl: 'Rdzeń', tr: 'Çekirdek' },
  face: { en: 'Face', de: 'Gesicht', ar: 'الوجه', pl: 'Twarz', tr: 'Yüz' },
};

const VERSES: Record<string, string> = {
  chest: 'Q 13:28 — In the remembrance of Allah hearts find rest.',
  belly: 'Q 2:177 — Righteousness is in the heart and the belly.',
  core: 'Q 94:1 — Did We not expand your breast?',
  face: 'Q 55:26 — Every face shall turn to Him.',
};

export function HeartAtlas() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Label | null>(null);

  // The flame breathes; selecting a feeling intensifies it.
  const breathe = useSharedValue(0);
  const intensity = useSharedValue(0.5);
  useEffect(() => {
    if (reduced) { breathe.value = 0.5; return; }
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, breathe]);
  useEffect(() => {
    intensity.value = withTiming(sel ? 1 : 0.5, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [sel, intensity]);

  const flameProps = useAnimatedProps(() => ({
    opacity: 0.6 + 0.4 * intensity.value,
    transform: [{ scale: 1 + 0.08 * breathe.value * intensity.value }],
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LABELS;
    return LABELS.filter((l) => l.text.replace(/\n/g, ' ').toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, Label[]> = { chest: [], belly: [], core: [], face: [] };
    for (const l of filtered) groups[l.zone].push(l);
    return groups;
  }, [filtered]);

  const size = Math.min(width - 40, 200);
  const cx = size / 2;
  const cy = size * 0.42;

  return (
    <View>
      <SectionLabel>{t.heartAtlasTitle}</SectionLabel>
      <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartAtlasLead}</Text>

      {/* The lamp */}
      <View style={[styles.lampStage, { width: size, height: size + 20 }]}>
        <Svg width={size} height={size + 20} viewBox={`0 0 ${size} ${size + 20}`}>
          <Defs>
            <RadialGradient id="atlas-glow" cx="0.5" cy="0.4" r="0.5">
              <Stop offset="0" stopColor="#ffd98a" stopOpacity={sel ? 0.4 : 0.2} />
              <Stop offset="0.6" stopColor="#d4a95f" stopOpacity={sel ? 0.15 : 0.08} />
              <Stop offset="1" stopColor="#d4a95f" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="atlas-flame" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#fff3d6" stopOpacity="1" />
              <Stop offset="0.4" stopColor="#f5c66e" stopOpacity="0.8" />
              <Stop offset="1" stopColor="#d4a95f" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Niche */}
          <Path d={`M${cx - 36} ${cy + 42} L${cx - 36} ${cy - 16} Q${cx - 36} ${cy - 58} ${cx} ${cy - 64} Q${cx + 36} ${cy - 58} ${cx + 36} ${cy - 16} L${cx + 36} ${cy + 42} Z`}
            fill={colors.background} stroke={colors.rule} strokeWidth="1.2" />

          {/* Glow */}
          <Circle cx={cx} cy={cy} r={56} fill="url(#atlas-glow)" />

          {/* Lamp body */}
          <Ellipse cx={cx} cy={cy + 14} rx={18} ry={8} fill={colors.rule} stroke={colors.accent} strokeWidth="1" />
          <Path d={`M${cx - 18} ${cy + 14} Q${cx - 22} ${cy + 24} ${cx - 14} ${cy + 28} L${cx + 14} ${cy + 28} Q${cx + 22} ${cy + 24} ${cx + 18} ${cy + 14} Z`}
            fill={colors.background} stroke={colors.rule} strokeWidth="1" />

          {/* Flame */}
          <AnimatedPath animatedProps={flameProps}
            d={`M${cx} ${cy - 32} Q${cx - 8} ${cy - 16} ${cx - 5} ${cy - 3} Q${cx} ${cy + 3} ${cx + 5} ${cy - 3} Q${cx + 8} ${cy - 16} ${cx} ${cy - 32} Z`}
            fill="url(#atlas-flame)" origin={`${cx}, ${cy - 4}`} />
        </Svg>
      </View>

      {/* Selected feeling */}
      {sel && (
        <Card>
          <View style={styles.selRow}>
            <View style={[styles.zoneDot, { backgroundColor: ZONE_COLOR[sel.zone] }]} />
            <Text style={[styles.selName, { color: colors.text, fontFamily: Fonts.arabic }]}>{sel.text.replace(/\n/g, ' ')}</Text>
          </View>
          <Text style={[styles.selZone, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{ZONE_NAME[sel.zone][CONTENT_LOCALE] || ZONE_NAME[sel.zone].en}</Text>
          <Text style={[styles.selVerse, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{VERSES[sel.zone]}</Text>
        </Card>
      )}

      {/* Search */}
      <View style={[styles.searchRow, { borderBottomColor: colors.rule }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.heartAtlasSearch}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text, fontFamily: Fonts.sans }]}
          autoCorrect={false}
        />
        <Text style={[styles.count, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{filtered.length}</Text>
      </View>

      {/* Feelings list, grouped by zone */}
      {(['chest', 'belly', 'core', 'face'] as const).map((zone) => {
        const items = grouped[zone];
        if (!items.length) return null;
        return (
          <View key={zone}>
            <SectionLabel>{ZONE_NAME[zone][CONTENT_LOCALE] || ZONE_NAME[zone].en}</SectionLabel>
            <View style={styles.grid}>
              {items.map((l) => {
                const on = sel?.id === l.id;
                const col = ZONE_COLOR[l.zone];
                return (
                  <Pressable
                    key={l.id}
                    accessibilityRole="button"
                    accessibilityLabel={l.text.replace(/\n/g, ' ')}
                    onPress={() => setSel(l)}
                    style={({ pressed }) => [
                      styles.chip,
                      { borderColor: on ? col : colors.rule, backgroundColor: on ? col + '22' : 'transparent' },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.chipText, { color: on ? col : colors.text, fontFamily: Fonts.arabic }]}>{l.text.replace(/\n/g, ' ')}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartAtlasSource}</Text>
    </View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 12 },
  lampStage: { alignSelf: 'center', marginBottom: 8 },
  selRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  zoneDot: { width: 8, height: 8, borderRadius: 4 },
  selName: { fontSize: 28, lineHeight: 36 },
  selZone: { fontSize: 13, marginBottom: 6 },
  selVerse: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8, marginTop: 8, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  count: { fontSize: 13, marginLeft: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  pressed: { opacity: 0.6 },
  source: { fontSize: 13, lineHeight: 19, marginTop: 12 },
});
