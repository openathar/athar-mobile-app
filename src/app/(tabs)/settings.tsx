import { formatLocalTime } from '@openathar/athan-core-ts';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Divider, Screen, ScreenHeader, SectionLabel } from '@/components/screen';
import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { useAlarms } from '@/hooks/use-alarms';
import { useLocation } from '@/hooks/use-location';
import { PRAYER_ORDER } from '@/hooks/use-prayer';

const PRAYER_NAMES: Record<(typeof PRAYER_ORDER)[number], { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

const SOON_ROWS = [
  { label: 'Calculation method', hint: 'Muslim World League' },
  { label: 'Theme', hint: 'Follows the day — dawn, noon, dusk, night' },
];

export default function SettingsScreen() {
  const { colors, times, now } = usePhase();
  const { location } = useLocation();
  const { enabled, toggle, permission } = useAlarms();
  const offsetHours = -now.getTimezoneOffset() / 60;

  return (
    <Screen>
      <ScreenHeader title="Settings" titleAr="الإعدادات" subtitle="Your alarms, your place" />

      <SectionLabel>adhan alarms</SectionLabel>
      <Card>
        {PRAYER_ORDER.map((key, i) => (
          <View key={key}>
            {i > 0 && <Divider />}
            <View style={styles.row}>
              <View style={styles.rowText}>
                <View style={styles.nameRow}>
                  <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>
                    {PRAYER_NAMES[key].en}
                  </Text>
                  <Text style={[styles.rowLabelAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
                    {PRAYER_NAMES[key].ar}
                  </Text>
                </View>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                  {formatLocalTime(times[key], offsetHours)}
                </Text>
              </View>
              <Switch
                value={enabled[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ true: colors.accent, false: colors.rule }}
                thumbColor="#ffffff"
                accessibilityLabel={`${PRAYER_NAMES[key].en} alarm`}
              />
            </View>
          </View>
        ))}
        {permission === 'denied' && (
          <>
            <Divider />
            <Text style={[styles.note, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
              Notifications are off — enable them in your system settings to receive adhan alarms.
            </Text>
          </>
        )}
      </Card>

      <SectionLabel>place</SectionLabel>
      <Card>
        <Link href="/location" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>Location</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
                  {location.label}
                </Text>
              </View>
              <Text style={[styles.action, { color: colors.accent, fontFamily: Fonts.mono }]}>change →</Text>
            </View>
          </Pressable>
        </Link>
      </Card>

      <SectionLabel>coming next</SectionLabel>
      <Card>
        {SOON_ROWS.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <Divider />}
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.sansMedium }]}>{row.label}</Text>
                <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>{row.hint}</Text>
              </View>
              <Text style={[styles.action, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>soon</Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionLabel>about</SectionLabel>
      <Card>
        <View style={styles.about}>
          <Text style={[styles.aboutAr, { color: colors.accent, fontFamily: Fonts.arabic }]}>
            وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ
          </Text>
          <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
            Athar — free, ad-free, no tracking. Built as Sadaqah Jariyah · openathar.org
          </Text>
          <Text style={[styles.credit, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
            sun & moon textures: Solar System Scope, NASA data, CC BY 4.0
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
    letterSpacing: 1,
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
  credit: {
    fontSize: 10,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});
