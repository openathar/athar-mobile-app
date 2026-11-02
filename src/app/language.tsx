import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, ModalHeader, Screen } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { useLanguage, type LanguagePreference } from '@/context/language';
import { usePhase } from '@/context/phase';
import { IS_RTL, LOCALES, LOCALE_NAMES, deviceLocale, t } from '@/lib/i18n';

/**
 * The app's language, independent of the phone's. Each language is listed in
 * its own name; "same as the phone" names the language that implies.
 */
export default function LanguageScreen() {
  const { colors } = usePhase();
  const { preference, setPreference } = useLanguage();

  const options: { value: LanguagePreference; label: string; hint?: string }[] = [
    { value: 'device', label: t.languageDevice, hint: LOCALE_NAMES[deviceLocale()] },
    ...LOCALES.map((l) => ({ value: l as LanguagePreference, label: LOCALE_NAMES[l] })),
  ];

  const choose = (value: LanguagePreference) => {
    if (value === preference) {
      router.back();
      return;
    }
    // The screens re-mount in the new language; this picker stays open, now
    // in that language, so the choice is visible before closing it.
    setPreference(value);
  };

  return (
    <Screen>
      <ModalHeader title={IS_RTL ? undefined : t.languageTitle} titleAr={IS_RTL ? t.languageTitle : 'اللغة'} subtitle={t.languageLead} />

      <Card>
        {options.map((o, i) => {
          const selected = o.value === preference;
          const isArabic = o.value === 'ar';
          return (
            <View key={o.value}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => choose(o.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.text}>
                  <Text
                    style={[
                      isArabic ? styles.nameAr : styles.name,
                      {
                        color: selected ? colors.accent : colors.text,
                        fontFamily: isArabic ? Fonts.arabic : selected ? Fonts.sansMedium : Fonts.sans,
                        // Arabic script would otherwise align to the right inside a left-to-right list.
                        textAlign: IS_RTL ? 'right' : 'left',
                      },
                    ]}>
                    {o.label}
                  </Text>
                  {o.hint ? (
                    <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: Fonts.sans, textAlign: IS_RTL ? 'right' : 'left' }]}>{o.hint}</Text>
                  ) : null}
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14 },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 18 },
  nameAr: { fontSize: 21, lineHeight: 30 },
  hint: { fontSize: 13 },
  mark: { fontSize: 16 },
  pressed: { opacity: 0.6 },
});
