import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import copyJson from '@/data/emotions-copy.json';
import { HEART, MAP_H, MAP_W, NAVEL, TEXT_IDS, clusters, counterpartOf, placed } from '@/data/emotion-map';
import { IS_RTL, LOCALE, t } from '@/lib/i18n';

const COPY = copyJson[LOCALE];
const GREEN = '#8fd1b4';
const VIEW = { x: -170, w: MAP_W + 340 };

/**
 * The website's feelings tree, drawn for the phone: branches in the chest,
 * roots in the belly, the heart as a flower. The tree grows outward from the
 * trunk when the screen opens; tap a twig to read the feeling and its
 * counterpart. Everything is bundled — it works without a connection.
 */
export default function FeelingsScreen() {
  const { colors } = usePhase();
  const { width } = useWindowDimensions();
  const [shown, setShown] = useState(0);
  const [sel, setSel] = useState<string>('love');
  const w = Math.min(width - 24, 560);
  const h = (w * MAP_H) / VIEW.w;

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 2;
      setShown(n);
      if (n >= clusters.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, []);

  const byId = useMemo(() => new Map(placed.map((p) => [p.id, p])), []);
  const nameOf = (id: string) => {
    const i = (TEXT_IDS as readonly string[]).indexOf(id);
    return i >= 0 ? COPY.items[i].name : byId.get(id)![LOCALE];
  };
  const cur = byId.get(sel)!;
  const ti = (TEXT_IDS as readonly string[]).indexOf(sel);
  const counter = counterpartOf(sel);
  const petals = useMemo(() => Array.from({ length: 16 }, (_, i) => i * 22.5), []);

  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.feelingsTitle} titleAr={IS_RTL ? t.feelingsTitle : 'المشاعر'} subtitle={t.feelingsLead} subtitleLines={2} />

      <View style={styles.figure}>
        <Svg width={w} height={h} viewBox={`${VIEW.x} 0 ${VIEW.w} ${MAP_H}`}>
          <Path d={`M${NAVEL.x} ${NAVEL.y}V${HEART.y}`} stroke={colors.text} strokeWidth={9} strokeLinecap="round" opacity={shown > 0 ? 1 : 0} />
          {clusters.map((c, ci) => {
            if (ci >= shown) return null;
            const ink = c.zone === 'belly' ? GREEN : colors.text;
            return (
              <G key={c.id}>
                {c.stem ? <Path d={c.stem} stroke={ink} strokeWidth={3.4} strokeLinecap="round" fill="none" /> : null}
                {c.members.map((m) => {
                  const p = placed[m];
                  const on = p.id === sel || p.id === counter;
                  return (
                    <G key={p.id}>
                      <Path d={p.d} stroke={on ? colors.accent : ink} strokeWidth={on ? 3.4 : 1.7} strokeLinecap="round" fill="none" opacity={on ? 1 : 0.8} />
                      <Circle cx={p.tip.x} cy={p.tip.y} r={on ? 8 : 4} fill={on ? colors.accent : ink} />
                    </G>
                  );
                })}
              </G>
            );
          })}
          <G transform={`translate(${HEART.x} ${HEART.y - 6})`} opacity={shown > clusters.length / 2 ? 1 : 0}>
            {petals.map((a) => (
              <Path key={a} d="M0 -30 m-8 0 a8 23 0 1 0 16 0 a8 23 0 1 0 -16 0" transform={`rotate(${a})`} fill={colors.accent} fillOpacity={0.2} stroke={colors.accent} strokeWidth={1.4} />
            ))}
            <Circle r={9} fill={colors.accent} />
          </G>
          <Circle cx={NAVEL.x} cy={NAVEL.y} r={8} fill={colors.text} />
        </Svg>
        {/* Tap targets sit above the drawing (SVG press handlers are unreliable on web). */}
        {placed.map((p) =>
          p.cluster < shown ? (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={nameOf(p.id)}
              onPress={() => setSel(p.id)}
              style={[styles.hit, { left: ((p.tip.x - VIEW.x) / VIEW.w) * w - 15, top: (p.tip.y / MAP_H) * h - 15 }]}
            />
          ) : null
        )}
      </View>

      <View style={[styles.sheet, { borderTopColor: colors.rule }]}>
        <Text style={[styles.zone, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>
          {cur.zone === 'belly' ? COPY.belly : COPY.chest} · {cur.side === 'strong' ? COPY.sideStrong : cur.side === 'weak' ? COPY.sideWeak : COPY.sideMid}
        </Text>
        <Text style={[styles.name, { color: colors.text, fontFamily: Fonts.display }]}>{nameOf(sel)}</Text>
        {LOCALE !== 'ar' && <Text style={[styles.ar, { color: colors.text, fontFamily: Fonts.arabic }]}>{cur.ar}</Text>}
        {ti >= 0 && <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{COPY.items[ti].body}</Text>}
        {counter && (
          <Pressable onPress={() => setSel(counter)} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.link, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>
              {COPY.counterpart}: {nameOf(counter)} {IS_RTL ? '←' : '→'}
            </Text>
          </Pressable>
        )}
      </View>

      <SectionLabel>{t.feelingsTitle}</SectionLabel>
      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{COPY.count.replace('{n}', String(placed.length))} {t.feelingsSource}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  figure: { alignItems: 'center', marginHorizontal: -8, alignSelf: 'center' },
  hit: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  sheet: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 8, alignItems: 'flex-start' },
  zone: { fontSize: 14 },
  name: { fontSize: 40, lineHeight: 48, letterSpacing: -1 },
  ar: { fontSize: 30, lineHeight: 46 },
  body: { fontSize: 16, lineHeight: 24 },
  link: { fontSize: 16, marginTop: 4 },
  pressed: { opacity: 0.7 },
  source: { fontSize: 13, lineHeight: 19 },
});
