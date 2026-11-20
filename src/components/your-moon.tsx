import { gregorianToHijri, moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { SectionLabel } from '@/components/screen';
import { MoonSphere } from '@/components/sphere';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { LOCALE, MOON_KEYS, t } from '@/lib/i18n';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const digits = (v: string | number) => (LOCALE === 'ar' ? String(v).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]) : String(v));
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/**
 * "Your moon": the moon of a day you pick (your birthday, or any day that matters), seen from the Earth,
 * north up, lit by that day's real phase (`moonPhaseAt`, the same engine as the website's). The date is
 * read at local noon. It stands still, unlike the start page's moon, so you can look at it.
 */
export function YourMoon({ n }: { n?: number } = {}) {
  const { colors, now } = usePhase();
  const width = useScreenWidth();
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [yearText, setYearText] = useState(String(now.getFullYear()));
  const year = Math.min(MAX_YEAR, Math.max(MIN_YEAR, Number(yearText) || now.getFullYear()));
  const safeDay = Math.min(day, daysIn(year, month));

  const date = useMemo(() => new Date(year, month - 1, safeDay, 12), [year, month, safeDay]);
  const phase = useMemo(() => moonPhaseAt(date), [date]);
  const hijri = useMemo(() => gregorianToHijri(date, 'ar'), [date]);
  const fraction = useSharedValue(phase.phaseAngle / 360);
  useEffect(() => {
    fraction.value = phase.phaseAngle / 360;
  }, [phase.phaseAngle, fraction]);

  const size = Math.min(width - 150, 240);
  const rows: [string, string][] = [
    [t[MOON_KEYS[phase.key] ?? 'moonNew'], `${digits(Math.round(phase.illumination * 100))} % ${t.illumination.toLowerCase()}`],
    [t.hijriDate, `${digits(hijri.day)} ${hijri.monthName} ${digits(hijri.year)}`],
  ];

  return (
    <View>
      <SectionLabel n={n}>{t.yourMoon}</SectionLabel>
      <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.yourMoonHint}</Text>

      <View style={styles.stage} pointerEvents="none">
        <MoonSphere size={size} fraction={fraction} spin={false} />
      </View>

      {rows.map(([k, v]) => (
        <View key={k} style={[styles.row, { borderTopColor: colors.rule }]}>
          <Text style={[styles.k, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{k}</Text>
          <Text style={[styles.v, { color: colors.text, fontFamily: LOCALE === 'ar' ? Fonts.sans : Fonts.mono }]}>{v}</Text>
        </View>
      ))}

      <View style={styles.pickers}>
        <Stepper
          label={t.dayShort}
          value={digits(safeDay)}
          onStep={(d) => setDay((safeDay - 1 + d + daysIn(year, month)) % daysIn(year, month) + 1)}
        />
        <Stepper label={t.monthShort} value={digits(month)} onStep={(d) => setMonth(((month - 1 + d + 12) % 12) + 1)} />
        <View style={styles.year}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.yearShort}</Text>
          <TextInput
            value={yearText}
            onChangeText={(v) => setYearText(v.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => setYearText(String(year))}
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel={t.yearShort}
            style={[styles.input, { color: colors.text, borderColor: colors.rule, fontFamily: Fonts.mono }]}
          />
        </View>
      </View>
    </View>
  );
}

function Stepper({ label, value, onStep }: { label: string; value: string; onStep: (delta: 1 | -1) => void }) {
  const { colors } = usePhase();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} −`} hitSlop={8} onPress={() => onStep(-1)} style={({ pressed }) => [styles.btn, { borderColor: colors.rule }, pressed && styles.pressed]}>
          <Text style={[styles.btnText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>−</Text>
        </Pressable>
        <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.mono }]}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} +`} hitSlop={8} onPress={() => onStep(1)} style={({ pressed }) => [styles.btn, { borderColor: colors.rule }, pressed && styles.pressed]}>
          <Text style={[styles.btnText, { color: colors.accent, fontFamily: Fonts.sansSemiBold }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  stage: { alignItems: 'center', marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  k: { fontSize: 15 },
  v: { fontSize: 15 },
  pickers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  stepper: { alignItems: 'center' },
  year: { alignItems: 'center' },
  label: { fontSize: 12, marginBottom: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 20, lineHeight: 22 },
  value: { fontSize: 17, minWidth: 30, textAlign: 'center' },
  input: { width: 84, height: 36, borderWidth: 1, borderRadius: 18, textAlign: 'center', fontSize: 17, paddingVertical: 0 },
  pressed: { opacity: 0.6 },
});
