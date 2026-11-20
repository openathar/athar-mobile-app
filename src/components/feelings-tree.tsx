import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import copyJson from '@/data/emotions-copy.json';
import { HEART, MAP_H, MAP_W, NAVEL, TEXT_IDS, clusters, counterpartOf, placed } from '@/data/emotion-map';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { useReducedMotion } from '@/hooks/use-motion';
import { CONTENT_LOCALE, IS_RTL, LOCALE, t, type Locale } from '@/lib/i18n';

type Labels = Pick<(typeof copyJson)['en'], 'counterpart' | 'chest' | 'belly' | 'sideStrong' | 'sideWeak' | 'sideMid' | 'count'>;

/**
 * The tree's labels in Polish and Turkish. The feelings themselves (names and
 * texts) stay in English there until the research copy has an editorially
 * reviewed translation — the screen says so.
 */
const LABELS: Partial<Record<Locale, Labels>> = {
  pl: {
    counterpart: 'Jego przeciwieństwo',
    chest: 'Pierś · gałęzie',
    belly: 'Brzuch · korzenie',
    sideStrong: 'Prawa strona ciała · silniejsza',
    sideWeak: 'Lewa strona ciała · słabsza',
    sideMid: 'Środek',
    count: 'Mapa liczy 135 uczuć i czujników. {n} z nich jest tutaj.',
  },
  tr: {
    counterpart: 'Karşıtı',
    chest: 'Göğüs · dallar',
    belly: 'Karın · kökler',
    sideStrong: 'Vücudun sağ tarafı · daha güçlü',
    sideWeak: 'Vücudun sol tarafı · daha zayıf',
    sideMid: 'Orta',
    count: 'Harita 135 duygu ve algıyı sayar. Bunların {n} tanesi burada.',
  },
};
const VIEW = { x: -170, w: MAP_W + 340 };
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A faint dashed arc between a feeling and its counterpart, bowing gently off the straight line. */
function linkPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(64, len * 0.32);
  const px = (-dy / len) * bow;
  const py = (dx / len) * bow;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx + px).toFixed(1)} ${(my + py).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** A breathing halo around the chosen feeling and its counterpart. */
function Halo({ cx, cy, color, breathe }: { cx: number; cy: number; color: string; breathe: SharedValue<number> }) {
  const props = useAnimatedProps(() => ({
    r: 10 + 5 * breathe.value,
    opacity: 0.55 - 0.4 * breathe.value,
  }));
  return <AnimatedCircle animatedProps={props} cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={2} />;
}

/**
 * The website's feelings tree, drawn for the phone: branches in the chest,
 * roots in the belly, the heart as a flower. The tree grows outward from the
 * trunk when the screen opens; tap a twig to read the feeling and its
 * counterpart. Everything is bundled — it works without a connection.
 */
export function FeelingsTree() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  // Read per render: the language can change while the app runs.
  const COPY = { ...copyJson[CONTENT_LOCALE], ...LABELS[LOCALE] };
  const fallback = CONTENT_LOCALE !== LOCALE;
  const [shown, setShown] = useState(0);
  const [sel, setSel] = useState<string>('love');
  const reduced = useReducedMotion();
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      breathe.value = 0.5;
      return;
    }
    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      breathe.value = 0;
    };
  }, [reduced, breathe]);
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
    return i >= 0 ? COPY.items[i].name : byId.get(id)![CONTENT_LOCALE];
  };
  const cur = byId.get(sel)!;
  const ti = (TEXT_IDS as readonly string[]).indexOf(sel);
  const counter = counterpartOf(sel);
  const petals = useMemo(() => Array.from({ length: 16 }, (_, i) => i * 22.5), []);
  const heartProps = useAnimatedProps(() => {
    const s = 1 + 0.05 * breathe.value;
    return { transform: `translate(${HEART.x} ${HEART.y - 6}) scale(${s} ${s})` };
  });
  const counterTip = counter ? byId.get(counter)?.tip : null;

  return (
    <View>

      <View style={styles.figure}>
        <Svg width={w} height={h} viewBox={`${VIEW.x} 0 ${VIEW.w} ${MAP_H}`}>
          <Path d={`M${NAVEL.x} ${NAVEL.y}V${HEART.y}`} stroke={colors.text} strokeWidth={9} strokeLinecap="round" opacity={shown > 0 ? 1 : 0} />
          {counterTip ? <Path d={linkPath(cur.tip, counterTip)} stroke={colors.accent} strokeWidth={1.4} strokeDasharray="4 6" fill="none" opacity={0.45} /> : null}
          {clusters.map((c, ci) => {
            if (ci >= shown) return null;
            const ink = c.zone === 'belly' ? colors.green : colors.text;
            return (
              <G key={c.id}>
                {c.stem ? <Path d={c.stem} stroke={ink} strokeWidth={3.4} strokeLinecap="round" fill="none" /> : null}
                {c.members.map((m) => {
                  const p = placed[m];
                  const on = p.id === sel || p.id === counter;
                  return (
                    <G key={p.id}>
                      {on ? <Halo cx={p.tip.x} cy={p.tip.y} color={colors.accent} breathe={breathe} /> : null}
                      <Path d={p.d} stroke={on ? colors.accent : ink} strokeWidth={on ? 3.4 : 1.7} strokeLinecap="round" fill="none" opacity={on ? 1 : 0.8} />
                      <Circle cx={p.tip.x} cy={p.tip.y} r={on ? 8 : 4} fill={on ? colors.accent : ink} />
                    </G>
                  );
                })}
              </G>
            );
          })}
          <AnimatedG animatedProps={heartProps} opacity={shown > clusters.length / 2 ? 1 : 0}>
            {petals.map((a) => (
              <Path key={a} d="M0 -30 m-8 0 a8 23 0 1 0 16 0 a8 23 0 1 0 -16 0" transform={`rotate(${a})`} fill={colors.accent} fillOpacity={0.2} stroke={colors.accent} strokeWidth={1.4} />
            ))}
            <Circle r={9} fill={colors.accent} />
          </AnimatedG>
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
        {fallback && <Text style={[styles.fallback, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.contentInEnglish}</Text>}
        {counter && (
          <Pressable onPress={() => setSel(counter)} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.link, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>
              {COPY.counterpart}: {nameOf(counter)} {IS_RTL ? '←' : '→'}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.source, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{COPY.count.replace('{n}', LOCALE === 'ar' ? String(placed.length).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(placed.length))} {t.feelingsSource}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The drawing is physical (left = strong side), so the tap targets stay LTR in Arabic too.
  figure: { alignItems: 'center', marginHorizontal: -8, alignSelf: 'center', direction: 'ltr' },
  hit: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  sheet: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 8, alignItems: 'flex-start' },
  zone: { fontSize: 14 },
  name: { fontSize: 40, lineHeight: 48, letterSpacing: -1 },
  ar: { fontSize: 30, lineHeight: 46 },
  body: { fontSize: 16, lineHeight: 24 },
  link: { fontSize: 16, marginTop: 4 },
  fallback: { fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.7 },
  source: { fontSize: 13, lineHeight: 19, marginTop: 16 },
});
