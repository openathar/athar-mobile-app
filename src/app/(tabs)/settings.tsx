import Constants from 'expo-constants';
import { formatLocalTime } from '@openathar/athan-core-ts';
import { Link } from 'expo-router';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Switch } from '@/components/switch';
import { Fonts } from '@/constants/theme';
import { useLanguage } from '@/context/language';
import { usePhase } from '@/context/phase';
import { useSettingsContext, type ThemeKey } from '@/context/settings';
import { useAlarms } from '@/hooks/use-alarms';
import { useLocation } from '@/hooks/use-location';
import { ALARM_PRAYERS, PRAYER_ORDER } from '@/hooks/use-prayer';
import { LOCALE, LOCALE_NAMES, PRAYER_KEYS, t } from '@/lib/i18n';
import { methodNames } from '@/lib/method-names';

const ARABIC_NAMES: Record<(typeof PRAYER_ORDER)[number], string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

/** Read at render time — the language can change while the app runs. */
const themeNames = (): Record<ThemeKey, string> => ({
  sunGarnet: t.thSunGarnet,
  sunEmerald: t.thSunEmerald,
  obsidian: t.thObsidian,
  lapis: t.thLapis,
  porcelain: t.thPorcelain,
});

/** Opens the system page of this app (permissions, battery, "Alarms & reminders"). */
function SettingsLink() {
  const { colors } = usePhase();
  return (
    <Pressable
      onPress={() => Linking.openSettings().catch(() => {})}
      accessibilityRole="button"
      style={({ pressed }) => [styles.settingsLink, pressed && styles.pressed]}>
      <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{t.openSettings}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, times, now } = usePhase();
  const { location } = useLocation();
  const { enabled, toggle, permission } = useAlarms();
  const { method, methodIsAuto, theme } = useSettingsContext();
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
            <SettingsLink />
          </>
        )}
      </Card>

      {/* Android only: battery limits and the exact-alarm permission decide whether an alarm is on time. */}
      {Platform.OS === 'android' && permission === 'granted' && (
        <>
          <SectionLabel>{t.reliabilityTitle}</SectionLabel>
          <Card>
            <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.reliabilityBody}</Text>
            <SettingsLink />
          </Card>
        </>
      )}

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
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{methodNames()[method]}{methodIsAuto ? ` · ${t.methodAuto}` : ''}</Text>
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
        <Link href="/theme" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{t.theme}</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{themeNames()[theme]}</Text>
              </View>
              <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>{t.change}</Text>
            </View>
          </Pressable>
        </Link>
      </Card>

      <SectionLabel>{t.about}</SectionLabel>
      <Card>
        <View style={styles.about}>
          <Text style={[styles.aboutAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
            وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ
          </Text>
          {/* The verse the name comes from (it stood under Today's hero until 2026-11-20). */}
          {LOCALE !== 'ar' ? (
            <Text style={[styles.rowHint, { color: colors.text, fontFamily: Fonts.sans }]}>{t.ayahAthar}</Text>
          ) : null}
          <Text style={[styles.credit, { color: colors.accent, fontFamily: Fonts.mono, opacity: 1 }]}>{t.ayahAtharRef}</Text>
          <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            {t.aboutText}
          </Text>
          <Text style={[styles.creditLabel, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.creditLabel}</Text>
          <Text style={[styles.credit, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{t.credit}</Text>
          <Text style={[styles.creditLabel, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{t.creditFanousLabel}</Text>
          <Text style={[styles.credit, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{t.creditFanous}</Text>
          <Text style={[styles.credit, { color: colors.textSecondary, fontFamily: Fonts.mono, marginTop: 10 }]}>
            v{Constants.expoConfig?.version ?? '1.0.0'} · MIT · github.com/openathar
          </Text>
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
  settingsLink: {
    paddingBottom: 14,
    alignSelf: 'flex-start',
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
