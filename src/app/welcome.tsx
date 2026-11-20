import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigMoon } from '@/components/celestial';
import { Screen } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { useAlarmsContext } from '@/context/alarms';
import { useLocationContext } from '@/context/location';
import { usePhase } from '@/context/phase';
import { useScreenWidth } from '@/hooks/use-screen-width';
import { IS_RTL, t } from '@/lib/i18n';
import { markWelcomed } from '@/lib/welcome';

/**
 * The first open: the website's hero in the pocket — "A trace that keeps
 * going." under tonight's real moon, the four promises, then one honest
 * sentence each about the location and the adhan alarms. The system prompts
 * come only at the very end, one after the other — never two at once, never
 * before the reason was said. Shown once.
 */
type Place = 'auto' | 'city' | 'later';
export default function WelcomeScreen() {
  const { colors } = usePhase();
  const width = useScreenWidth();
  const { allowPrompt, setCustom } = useLocationContext();
  const { requestPermission } = useAlarmsContext();
  // Dev only: `/welcome?step=2` opens a later page for simulator screenshots.
  const { step: devStep } = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<0 | 1 | 2>(__DEV__ && (devStep === '1' || devStep === '2') ? (Number(devStep) as 1 | 2) : 0);
  const [place, setPlace] = useState<Place>('later');

  const choose = (p: Place) => {
    setPlace(p);
    setStep(2);
  };

  const finish = async (alarms: boolean) => {
    if (alarms) await requestPermission().catch(() => undefined);
    await markWelcomed();
    router.back();
    if (place === 'auto') {
      setCustom(null);
      allowPrompt();
    } else if (place === 'city') {
      setTimeout(() => router.push('/location'), 350);
    }
  };

  return (
    <Screen>
      {step === 0 ? (
        <View style={styles.page}>
          <View style={styles.moon}>
            <BigMoon size={Math.min(width - 120, 240)} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.accent, fontFamily: Fonts.mono }]}>{t.welcomeEyebrow}</Text>
          <Text style={[IS_RTL ? styles.titleAr : styles.title, { color: colors.text, fontFamily: IS_RTL ? Fonts.arabicBold : Fonts.display }]}>
            {t.welcomeTitle1}
            {'\n'}
            <Text style={{ color: colors.textSecondary }}>{t.welcomeTitle2}</Text>
          </Text>
          <Text style={[styles.lead, { color: colors.text, fontFamily: Fonts.sans }]}>{t.welcomeLead}</Text>

          <View style={[styles.promises, { borderColor: colors.rule }]}>
            {[t.welcomeP1, t.welcomeP2, t.welcomeP3, t.welcomeP4].map((p) => (
              <View key={p} style={styles.promise}>
                <View style={[styles.dot, { backgroundColor: colors.green }]} />
                <Text style={[styles.promiseText, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.ayah, { borderColor: colors.rule }]}>
            <Text style={[styles.ayahAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ</Text>
            <Text style={[styles.ayahRef, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{t.ayahAtharRef}</Text>
          </View>

          <Button label={t.welcomeBegin} onPress={() => setStep(1)} />
        </View>
      ) : step === 1 ? (
        <View style={[styles.page, styles.placePage]}>
          <Text style={[styles.placeTitle, { color: colors.text, fontFamily: IS_RTL ? Fonts.arabicBold : Fonts.display }]}>{t.welcomePlaceTitle}</Text>
          <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.welcomePlaceBody}</Text>
          <Button label={t.welcomeUseLocation} onPress={() => choose('auto')} />
          <Button label={t.welcomePickCity} ghost onPress={() => choose('city')} />
          <Later onPress={() => choose('later')} />
        </View>
      ) : (
        <View style={[styles.page, styles.placePage]}>
          <Text style={[styles.placeTitle, { color: colors.text, fontFamily: IS_RTL ? Fonts.arabicBold : Fonts.display }]}>{t.welcomeAlarmsTitle}</Text>
          <Text style={[styles.lead, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.alarmsExplainBody}</Text>
          <Button label={t.welcomeAllowAlarms} onPress={() => finish(true)} />
          <Later onPress={() => finish(false)} />
        </View>
      )}
    </Screen>
  );
}

function Later({ onPress }: { onPress: () => void }) {
  const { colors } = usePhase();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10} style={({ pressed }) => [styles.later, pressed && styles.pressed]}>
      <Text style={[styles.laterText, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>{t.welcomeLater}</Text>
    </Pressable>
  );
}

/** The website's gold pill (`lp-btn`), or its outlined twin. */
function Button({ label, onPress, ghost = false }: { label: string; onPress: () => void; ghost?: boolean }) {
  const { colors } = usePhase();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        ghost ? { borderColor: colors.rule, borderWidth: 1 } : { backgroundColor: colors.accent },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.btnText, { color: ghost ? colors.text : colors.onAccent, fontFamily: Fonts.sansSemiBold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 28, gap: 16 },
  placePage: { paddingTop: 120, gap: 18 },
  moon: { alignItems: 'center', marginBottom: 8 },
  eyebrow: { fontSize: 12, letterSpacing: 0.6 },
  title: { fontSize: 50, lineHeight: 56, letterSpacing: -1.6 },
  titleAr: { fontSize: 48, lineHeight: 84 },
  lead: { fontSize: 17, lineHeight: 26 },
  promises: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  promiseText: { fontSize: 15 },
  ayah: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  ayahAr: { fontSize: 26, lineHeight: 46 },
  ayahRef: { fontSize: 12 },
  btn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 17, borderRadius: 999 },
  btnText: { fontSize: 17 },
  placeTitle: { fontSize: 40, lineHeight: 52, letterSpacing: -1 },
  later: { alignSelf: 'center', paddingVertical: 8 },
  laterText: { fontSize: 15 },
  pressed: { opacity: 0.75 },
});
