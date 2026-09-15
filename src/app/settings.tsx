import { formatLocalTime } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAlarms } from '@/hooks/use-alarms';
import { useLocation } from '@/hooks/use-location';
import { PRAYER_ORDER, getTodayTimes } from '@/hooks/use-prayer';

const PRAYER_NAMES: Record<(typeof PRAYER_ORDER)[number], { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

const SOON_ROWS = [
  { label: 'Location', hint: 'Berlin — change to your city' },
  { label: 'Calculation method', hint: 'Muslim World League' },
  { label: 'Theme', hint: 'Follows your device' },
  { label: 'About', hint: 'Athar — openathar.org' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { location } = useLocation();
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  const times = useMemo(
    () => getTodayTimes(new Date(), location.lat, location.lng),
    [location]
  );
  const { enabled, toggle, permission } = useAlarms(times);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>Settings</Text>
        <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          Coming with the next milestones.
        </Text>

        <Text style={[styles.section, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
          ADHAN ALARMS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          {PRAYER_ORDER.map((key, i) => (
            <View
              key={key}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>
                  {PRAYER_NAMES[key].en} <Text style={{ color: colors.accent, fontFamily: Fonts.arabic }}>{PRAYER_NAMES[key].ar}</Text>
                </Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {formatLocalTime(times[key], offsetHours)}
                </Text>
              </View>
              <Switch
                value={enabled[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ true: colors.accent, false: colors.rule }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
          {permission === 'denied' && (
            <Text style={[styles.permissionNote, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              Notifications are disabled — enable them in your system settings to receive adhan alarms.
            </Text>
          )}
        </View>

        <Text style={[styles.section, { color: colors.textSecondary, fontFamily: Fonts.sansMedium }]}>
          MORE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          {SOON_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                  {row.hint}
                </Text>
              </View>
              <Text style={[styles.soon, { color: colors.accent, fontFamily: Fonts.sansMedium }]}>soon</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  sub: {
    fontSize: 14,
    marginTop: Spacing.one,
  },
  section: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    fontSize: 12,
    letterSpacing: 2,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowHint: {
    fontSize: 13,
    opacity: 0.85,
  },
  soon: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionNote: {
    fontSize: 12,
    paddingBottom: Spacing.three,
    opacity: 0.85,
  },
});