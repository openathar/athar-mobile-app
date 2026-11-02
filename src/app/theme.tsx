import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, ModalHeader, Screen } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { FIXED_THEME_COLOR, THEME_KEYS, useSettingsContext, type ThemeKey } from '@/context/settings';
import { IS_RTL, t } from '@/lib/i18n';
import { daySwatches } from '@/lib/sky';

/** Name and one-line description per theme — read at render time (the language can change). */
const labels = (): Record<ThemeKey, { name: string; hint: string }> => ({
  sunGarnet: { name: t.thSunGarnet, hint: t.thSunGarnetHint },
  sunEmerald: { name: t.thSunEmerald, hint: t.thSunEmeraldHint },
  obsidian: { name: t.thObsidian, hint: t.thObsidianHint },
  lapis: { name: t.thLapis, hint: t.thLapisHint },
  porcelain: { name: t.thPorcelain, hint: t.thPorcelainHint },
});

/**
 * The page colour themes. Each row shows its stones as small discs: a sun
 * theme as the day passing from night to Maghrib, a one-stone theme as one.
 */
export default function ThemeScreen() {
  const { colors } = usePhase();
  const { theme, setTheme } = useSettingsContext();
  const names = labels();

  return (
    <Screen>
      <ModalHeader title={IS_RTL ? undefined : t.theme} titleAr={IS_RTL ? t.theme : 'المظهر'} subtitle={t.themeLead} />

      <Card>
        {THEME_KEYS.map((key, i) => {
          const selected = key === theme;
          const fixed = FIXED_THEME_COLOR[key];
          const stones = fixed ? [fixed] : daySwatches(key === 'sunEmerald' ? 'emerald' : 'garnet');
          return (
            <View key={key}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => {
                  setTheme(key);
                  router.back();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.text}>
                  <Text style={[styles.name, { color: selected ? colors.accent : colors.text, fontFamily: selected ? Fonts.sansMedium : Fonts.sans }]}>
                    {names[key].name}
                  </Text>
                  <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{names[key].hint}</Text>
                  <View style={styles.stones}>
                    {stones.map((c, j) => (
                      <View key={j} style={[fixed ? styles.stoneLarge : styles.stone, { backgroundColor: c, borderColor: colors.rule }]} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.mark, { color: colors.accent, opacity: selected ? 1 : 0 }]}>✓</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16 },
  text: { flex: 1, gap: 3 },
  name: { fontSize: 17 },
  hint: { fontSize: 13 },
  // Stones overlap slightly, like beads on a string — the day as a sequence.
  stones: { flexDirection: 'row', marginTop: 8 },
  stone: { width: 26, height: 26, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, marginEnd: -6 },
  stoneLarge: { width: 26, height: 26, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth },
  mark: { fontSize: 16 },
  pressed: { opacity: 0.6 },
});
