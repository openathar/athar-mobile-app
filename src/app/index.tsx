import { Methods, PrayerTimes, formatLocalTime } from '@openathar/athan-core-ts';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_LOCATION } from '@/constants/location';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;

type PrayerKey = (typeof PRAYERS)[number]['key'];

export default function PrayerScreen() {
  const { timings, dateLabel } = useMemo(() => {
    const now = new Date();
    // Device-local UTC offset in hours — avoids Intl timezone edge cases on Hermes.
    const offsetHours = -now.getTimezoneOffset() / 60;
    const result = new PrayerTimes(Methods.MWL).getTimes(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      DEFAULT_LOCATION.lat,
      DEFAULT_LOCATION.lng,
    );
    const timings = {} as Record<PrayerKey, string>;
    for (const { key } of PRAYERS) {
      timings[key] = formatLocalTime(result[key], offsetHours);
    }
    return { timings, dateLabel: now.toLocaleDateString() };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Prayer Times
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {dateLabel} · {DEFAULT_LOCATION.label}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.list}>
          {PRAYERS.map(({ key, label }) => (
            <ThemedView key={key} type="backgroundElement" style={styles.row}>
              <ThemedText>{label}</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {timings[key]}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
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
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  list: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});