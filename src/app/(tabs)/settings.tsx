import { formatLocalTime } from '@openathar/athan-core-ts';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Switch } from '@/components/switch';
import { Fonts } from '@/constants/theme';
import { useLanguage } from '@/context/language';
import { usePhase } from '@/context/phase';
import { useSettingsContext, type MethodKey } from '@/context/settings';
import { useAlarms } from '@/hooks/use-alarms';
import { useLocation } from '@/hooks/use-location';
import { ALARM_PRAYERS, PRAYER_ORDER } from '@/hooks/use-prayer';
import { LOCALE, LOCALE_NAMES, PRAYER_KEYS, t } from '@/lib/i18n';

const ARABIC_NAMES: Record<(typeof PRAYER_ORDER)[number], string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

/** Read at render time — the language can change while the app runs. */
const methodNames = (): Record<MethodKey, string> => ({
  MWL: t.methodMWL,
  ISNA: t.methodISNA,
  EGYPT: t.methodEGYPT,
  MAKKAH: t.methodMAKKAH,
  KARACHI: t.methodKARACHI,
  TEHRAN: t.methodTEHRAN,
});

export default function SettingsScreen() {
  const { colors, times, now } = usePhase();
  const { location } = useLocation();
  const { enabled, toggle, permission } = useAlarms();
  const { method } = useSettingsContext();
  const { preference, locale } = useLanguage();
  const offsetHours = -now.getTimezoneOffset() / 60;

  return (
    <Screen>
      <ScreenHeader title={LOCALE === 'ar' ? undefined : t.settingsTitle} titleAr={LOCALE === 'ar' ? t.settingsTitle : 'الإعدادات'} subtitle={t.settingsSub} />

      <SectionLabel>{t.adhanAlarms}</SectionLabel>
      <Card>
        {ALARM_PRAYERS.map((key, i) => (
          <View key={key}>
            {i > 0 && <Divider />}
            <View style={styles.row}>
              <View style={styles.rowText}>
                <View style={styles.nameRow}>
                  <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>
                    {t[PRAYER_KEYS[key]]}
                  </Text>
                  {LOCALE !== 'ar' && (
                    <Text style={[styles.rowLabelAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
                      {ARABIC_NAMES[key]}
                    </Text>
                  )}
                </View>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {formatLocalTime(times[key], offsetHours)}
                </Text>
              </View>
              <Switch
                value={enabled[key]}
                onChange={() => toggle(key)}
                label={`${t[PRAYER_KEYS[key]]} ${t.alarmFor}`}
              />
            </View>
          </View>
        ))}
        {permission === 'denied' && (
          <>
            <Divider />
            <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              {t.notificationsOff}
            </Text>
          </>
        )}
      </Card>

      <SectionLabel>{t.place}</SectionLabel>
      <Card>
        <Link href="/location" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t.location}</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                  {location.label}
                </Text>
              </View>
              <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{t.change}</Text>
            </View>
          </Pressable>
        </Link>
      </Card>

      <SectionLabel>{t.times}</SectionLabel>
      <Card>
        <Link href="/method" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t.calcMethod}</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{methodNames()[method]}</Text>
              </View>
              <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{t.change}</Text>
            </View>
          </Pressable>
        </Link>
      </Card>

      <SectionLabel>{t.display}</SectionLabel>
      <Card>
        <Link href="/language" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t.language}</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                  {preference === 'device' ? `${t.languageDevice} · ${LOCALE_NAMES[locale]}` : LOCALE_NAMES[locale]}
                </Text>
              </View>
              <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{t.change}</Text>
            </View>
          </Pressable>
        </Link>
        <Divider />
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t.automatic}</Text>
            <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.themeHint}</Text>
          </View>
        </View>
      </Card>

      <SectionLabel>{t.about}</SectionLabel>
      <Card>
        <View style={styles.about}>
          <Text style={[styles.aboutAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
            وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ
          </Text>
          <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {t.aboutText}
          </Text>
          <Text style={[styles.creditLabel, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.creditLabel}</Text>
          <Text style={[styles.credit, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{t.credit}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 16,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowLabelAr: {
    fontSize: 15,
  },
  rowHint: {
    fontSize: 13,
  },
  action: {
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  about: {
    paddingVertical: 16,
    gap: 8,
  },
  aboutAr: {
    fontSize: 20,
    lineHeight: 34,
  },
  creditLabel: {
    fontSize: 12,
  },
  credit: {
    fontSize: 11,
    letterSpacing: 0.3,
    opacity: 0.8,
  },
});
