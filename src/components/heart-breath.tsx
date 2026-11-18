import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const TREE_IMG = require('../../assets/images/tree-body.png');
import Animated, { Easing, FadeIn, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Card, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useReducedMotion } from '@/hooks/use-motion';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { CONTENT_LOCALE, IS_RTL, LOCALE, t } from '@/lib/i18n';

import labelsData from '@/data/labels.json';

/**
 * "The Breath of the Heart" (نَفَس القلب) — after Ayat an-Nur (24:35).
 *
 * One feeling at a time, like the 99 Names: the Arabic name appears large,
 * the lamp's flame shifts colour and intensity, a verse and description
 * follow. Swipe or use the arrows to move through 199 feelings grouped by
 * body zone (chest → belly → core → face). The flame breathes on its own
 * and pulses when a new feeling arrives.
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
  chest: { en: 'Chest · branches', de: 'Brust · Äste', ar: 'الصدر · الأغصان', pl: 'Pierś · gałęzie', tr: 'Göğüs · dallar' },
  belly: { en: 'Belly · roots', de: 'Bauch · Wurzeln', ar: 'البطن · الجذور', pl: 'Brzuch · korzenie', tr: 'Karın · kökler' },
  core: { en: 'Core · heart', de: 'Kern · Herz', ar: 'المركز · القلب', pl: 'Rdzeń · serce', tr: 'Çekirdek · kalp' },
  face: { en: 'Face · senses', de: 'Gesicht · Sinne', ar: 'الوجه · الحواس', pl: 'Twarz · zmysły', tr: 'Yüz · duyular' },
};

const ZONE_VERSE: Record<string, string> = {
  chest: 'Q 13:28 — In the remembrance of Allah hearts find rest.',
  belly: 'Q 2:177 — Righteousness is in the heart and the belly.',
  core: 'Q 94:1 — Did We not expand your breast?',
  face: 'Q 55:26 — Every face shall turn to Him.',
};

const ZONE_ORDER = ['chest', 'belly', 'core', 'face'] as const;

export function HeartBreath() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LABELS;
    return LABELS.filter((l) => l.text.replace(/\n/g, ' ').toLowerCase().includes(q));
  }, [query]);

  const cur = filtered[Math.min(idx, filtered.length - 1)] || LABELS[0];
  const warm = ['chest', 'core'].includes(cur.zone);

  // Flame breathes; pulses when a new feeling arrives.
  // No flame animation needed — the body figure shows the zone directly.

  const size = Math.min(width - 40, 200);
  const cx = size / 2;
  const cy = size * 0.42;

  const zoneCounts = useMemo(() => {
    const c: Record<string, number> = { chest: 0, belly: 0, core: 0, face: 0 };
    for (const l of filtered) c[l.zone]++;
    return c;
  }, [filtered]);

  const zoneStart = useMemo(() => {
    const starts: Record<string, number> = {};
    let acc = 0;
    for (const z of ZONE_ORDER) { starts[z] = acc; acc += zoneCounts[z]; }
    return starts;
  }, [zoneCounts]);

  const currentZone = cur.zone;
  const zoneProgress = zoneCounts[currentZone] > 0
    ? ((filtered.indexOf(cur) - zoneStart[currentZone]) / zoneCounts[currentZone])
    : 0;

  const step = (d: 1 | -1) => {
    const next = (idx + d + filtered.length) % filtered.length;
    setIdx(next);
  };

  const zoneColor = ZONE_COLOR[cur.zone];

  return (
    <View>
      <SectionLabel>{t.heartBreathTitle}</SectionLabel>
      <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartBreathLead}</Text>

      {/* Search */}
      <View style={[styles.searchRow, { borderBottomColor: colors.rule }]}>
        <TextInput
          value={query}
          onChangeText={(q) => { setQuery(q); setIdx(0); }}
          placeholder={t.heartBreathSearch}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text, fontFamily: Fonts.sans }]}
          autoCorrect={false}
        />
        <Text style={[styles.count, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{filtered.length}</Text>
      </View>

      {/* Tree body image */}
      <View style={[styles.bodyStage, { width: size, height: size + 40 }]}>
        <Image source={TREE_IMG} style={{ width: size, height: size + 40 }} resizeMode="contain" />
        <View style={[styles.zoneBadge, { backgroundColor: ZONE_COLOR[cur.zone] + '33', borderColor: ZONE_COLOR[cur.zone] }]}>
          <Text style={[styles.zoneBadgeText, { color: ZONE_COLOR[cur.zone], fontFamily: Fonts.sansMedium }]}>{ZONE_NAME[cur.zone][CONTENT_LOCALE] || ZONE_NAME[cur.zone].en}</Text>
        </View>
      </View>

      {/* Zone indicator */}
      <View style={styles.zoneRow}>
        {ZONE_ORDER.map((z) => (
          <View key={z} style={[styles.zoneDot, { backgroundColor: z === currentZone ? ZONE_COLOR[z] : colors.rule }]} />
        ))}
        <Text style={[styles.zoneName, { color: ZONE_COLOR[currentZone], fontFamily: Fonts.sansMedium }]}>{ZONE_NAME[currentZone][CONTENT_LOCALE] || ZONE_NAME[currentZone].en}</Text>
        <Text style={[styles.zoneProgress, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{Math.round(zoneProgress * 100)}%</Text>
      </View>

      {/* Body region + progress */}
      <View style={styles.bodyRow}>
        <Svg width={60} height={100} viewBox="0 0 60 100">
          {/* Head */}
          <Circle cx={30} cy={14} r={10} fill={cur.zone === 'face' ? ZONE_COLOR.face : colors.rule} stroke={colors.textSecondary} strokeWidth="1" />
          {/* Neck */}
          <Rect x={27} y={24} width={6} height={6} fill={colors.rule} />
          {/* Torso */}
          <Path d="M18 30 Q14 30 14 36 L14 70 Q14 76 18 76 L42 76 Q46 76 46 70 L46 36 Q46 30 42 30 Z"
            fill={cur.zone === 'chest' ? ZONE_COLOR.chest + '66' : (cur.zone === 'core' ? ZONE_COLOR.core + '66' : colors.rule)} stroke={colors.textSecondary} strokeWidth="1" />
          {/* Belly highlight */}
          {cur.zone === 'belly' && <Ellipse cx={30} cy={62} rx={12} ry={8} fill={ZONE_COLOR.belly} fillOpacity={0.5} />}
          {/* Chest highlight */}
          {cur.zone === 'chest' && <Ellipse cx={30} cy={42} rx={14} ry={10} fill={ZONE_COLOR.chest} fillOpacity={0.5} />}
          {/* Core highlight */}
          {cur.zone === 'core' && <Circle cx={30} cy={52} r={8} fill={ZONE_COLOR.core} fillOpacity={0.5} />}
          {/* Face highlight */}
          {cur.zone === 'face' && <Circle cx={30} cy={14} r={10} fill={ZONE_COLOR.face} fillOpacity={0.5} />}
          {/* Arms */}
          <Path d="M14 36 L8 58 L10 60" stroke={colors.textSecondary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M46 36 L52 58 L50 60" stroke={colors.textSecondary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Legs */}
          <Path d="M22 76 L20 96" stroke={colors.textSecondary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M38 76 L40 96" stroke={colors.textSecondary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </Svg>
        <View style={styles.bodyInfo}>
          <Text style={[styles.bodyZone, { color: ZONE_COLOR[cur.zone], fontFamily: Fonts.sansMedium }]}>{ZONE_NAME[cur.zone][CONTENT_LOCALE] || ZONE_NAME[cur.zone].en}</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.rule }]}>
            <View style={[styles.progressFill, { backgroundColor: ZONE_COLOR[cur.zone], width: `${((idx + 1) / filtered.length) * 100}%` }]} />
          </View>
          <Text style={[styles.bodyProgress, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{idx + 1} / {filtered.length}</Text>
        </View>
      </View>

      {/* Feeling card */}
      <Animated.View entering={FadeIn.duration(400)} key={cur.id} style={[styles.card, { borderTopColor: colors.rule }]}>
        <Text style={[styles.arabic, { color: colors.text, fontFamily: Fonts.arabic }]}>{cur.text.replace(/\n/g, ' ')}</Text>
        <Text style={[styles.zone, { color: ZONE_COLOR[cur.zone], fontFamily: Fonts.sansMedium }]}>{ZONE_NAME[cur.zone][CONTENT_LOCALE] || ZONE_NAME[cur.zone].en}</Text>
        <Text style={[styles.verse, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{ZONE_VERSE[cur.zone]}</Text>
        <Text style={[styles.counterpart, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartBreathCounterpart}</Text>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.heartBreathPrev} onPress={() => step(-1)} style={({ pressed }) => [styles.navBtn, { borderColor: colors.rule }, pressed && styles.pressed]}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>{IS_RTL ? '›' : '‹'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t.heartBreathNext} onPress={() => step(1)} style={({ pressed }) => [styles.navBtn, { borderColor: colors.rule }, pressed && styles.pressed]}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>{IS_RTL ? '‹' : '›'}</Text>
        </Pressable>
      </View>

      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.heartBreathSource}</Text>
    </View>
  );
}



const styles = StyleSheet.create({
  lead: { fontSize: 15, lineHeight: 22, marginTop: 4, marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8, marginTop: 8, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  count: { fontSize: 13, marginLeft: 8 },
  bodyStage: { alignSelf: 'center', marginBottom: 8, position: 'relative' },
  zoneBadge: { position: 'absolute', bottom: 4, right: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  zoneBadgeText: { fontSize: 12 },
  bodyZoneLabel: { fontSize: 14, textAlign: 'center', marginBottom: 4 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  zoneName: { fontSize: 13, marginLeft: 4 },
  zoneProgress: { fontSize: 12, marginLeft: 'auto' },
  progressTrack: { height: 2, borderRadius: 1, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: 2, borderRadius: 1 },
  card: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20, paddingBottom: 16, alignItems: 'center', gap: 6 },
  arabic: { fontSize: 48, lineHeight: 72, textAlign: 'center' },
  zone: { fontSize: 13, marginTop: 4 },
  verse: { fontSize: 14, lineHeight: 20, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 24, lineHeight: 28 },
  counter: { fontSize: 14 },
  pressed: { opacity: 0.6 },
  source: { fontSize: 13, lineHeight: 19, marginTop: 16 },
  bodyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  bodyInfo: { flex: 1, gap: 4 },
  bodyZone: { fontSize: 14 },
  bodyProgress: { fontSize: 12 },
  counterpart: { fontSize: 13, marginTop: 8, fontStyle: 'italic' },
});
