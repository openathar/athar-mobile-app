import { moonPhaseAt, nextMoonEvents } from '@openathar/athan-core-ts';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { EarthMoon } from '@/components/earth-moon';
import { HijriCalendar } from '@/components/hijri-calendar';
import { PhaseDisc } from '@/components/phase-disc';
import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { FACES, daysUntilFraction } from '@/lib/lunation';
import { IS_RTL, MOON_KEYS, t } from '@/lib/i18n';

/**
 * The sky page of the website, in the pocket: tonight's real moon, its age
 * and the next new and full moon, the eight faces of the lunation and the
 * Hijri calendar with the next observances. All computed on the device.
 */
export default function SkyScreen() {
  const { colors, now } = usePhase();
  const { width } = useWindowDimensions();
  const [face, setFace] = useState<number | null>(null);
  const minute = useMemo(() => new Date(Math.floor(now.getTime() / 60000) * 60000), [now]);
  const moon = useMemo(() => moonPhaseAt(minute), [minute]);
  const events = useMemo(() => nextMoonEvents(minute), [minute]);
  const discs = Math.floor((width - 40) / 8);

  const rows: [string, string][] = [
    [t.illumination, `${Math.round(moon.illumination * 100)} %`],
    [t.moonAge, `${moon.ageDays.toFixed(1)} ${t.daysShort}`],
    [t.nextNew, t.inDays(Math.round(events.nextNewMoon))],
    [t.nextFull, t.inDays(Math.round(events.nextFullMoon))],
  ];

  return (
    <Screen>
      <ScreenHeader title={IS_RTL ? undefined : t.skyTitle} titleAr={IS_RTL ? t.skyTitle : 'السماء'} subtitle={t[MOON_KEYS[moon.key] ?? 'moonNew']} />

      <View style={styles.moon}>
        <EarthMoon width={Math.min(width - 24, 460)} />
      </View>

      <Card>
        {rows.map(([k, v], i) => (
          <View key={k}>
            {i > 0 && <Divider />}
            <View style={styles.row}>
              <Text style={[styles.k, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{k}</Text>
              <Text style={[styles.v, { color: colors.text, fontFamily: Fonts.mono }]}>{v}</Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionLabel>{t.facesTitle}</SectionLabel>
      <View style={styles.faces}>
        {FACES.map((f, i) => (
          <Pressable key={f.key} onPress={() => setFace(i)} style={({ pressed }) => [styles.face, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t[MOON_KEYS[f.key]]}>
            <PhaseDisc fraction={f.fraction} size={discs - 8} light={colors.moon.lit} dark={colors.moon.dark} ring={colors.rule} />
            <View style={[styles.mark, { backgroundColor: face === i ? colors.accent : 'transparent' }]} />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
        {face === null ? t.facesHint : `${t[MOON_KEYS[FACES[face].key]]} · ${t.returnsIn(daysUntilFraction(minute, FACES[face].fraction))}`}
      </Text>

      <HijriCalendar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  moon: { alignItems: 'center', marginTop: 4, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 14 },
  k: { fontSize: 16 },
  v: { fontSize: 17 },
  faces: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  face: { alignItems: 'center', gap: 6 },
  mark: { width: 14, height: 2, borderRadius: 1 },
  pressed: { opacity: 0.7 },
  hint: { fontSize: 15, marginTop: 8 },
});
