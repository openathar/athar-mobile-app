import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, ModalHeader, Screen } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { METHOD_KEYS, methodParams, useSettingsContext, type MethodKey } from '@/context/settings';
import { IS_RTL, t } from '@/lib/i18n';

/** Read at render time — the language can change while the app runs. */
const labels = (): Record<MethodKey, string> => ({
  MWL: t.methodMWL,
  ISNA: t.methodISNA,
  EGYPT: t.methodEGYPT,
  MAKKAH: t.methodMAKKAH,
  KARACHI: t.methodKARACHI,
  TEHRAN: t.methodTEHRAN,
});

/**
 * Picks the calculation convention. It is one choice for the whole app —
 * the countdown, today's list, "Anywhere", the Sky times and every scheduled
 * adhan are computed with it (the methods come from `@openathar/athan-core-ts`,
 * the same table the API uses).
 */
export default function MethodScreen() {
  const { colors } = usePhase();
  const { method, setMethod } = useSettingsContext();

  return (
    <Screen>
      <ModalHeader
        title={IS_RTL ? undefined : t.methodTitle}
        titleAr={IS_RTL ? t.methodTitle : 'طريقة الحساب'}
        subtitle={t.methodLead}
      />

      <Card>
        {METHOD_KEYS.map((key, i) => {
          const selected = key === method;
          return (
            <View key={key}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => {
                  setMethod(key);
                  router.back();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.text}>
                  <Text
                    style={[
                      styles.name,
                      { color: selected ? colors.accent : colors.text, fontFamily: selected ? Fonts.sansMedium : Fonts.sans },
                    ]}>
                    {labels()[key]}
                  </Text>
                  <Text style={[styles.params, { color: colors.textSecondary, fontFamily: Fonts.mono, textAlign: IS_RTL ? 'right' : 'left' }]}>
                    {methodParams(key)}
                  </Text>
                </View>
                <Text style={[styles.mark, { color: colors.accent, opacity: selected ? 1 : 0 }]}>✓</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.methodNote}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
  },
  params: {
    fontSize: 12,
  },
  mark: {
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 18,
  },
  pressed: {
    opacity: 0.6,
  },
});
