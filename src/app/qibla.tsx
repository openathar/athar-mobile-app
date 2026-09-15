import { qiblaBearing } from '@openathar/athan-core-ts';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_LOCATION } from '@/constants/location';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QiblaScreen() {
  const bearing = Math.round(qiblaBearing(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Qibla
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          from {DEFAULT_LOCATION.label}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.bearingBox}>
          <ThemedText type="subtitle">{bearing}°</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            from true north
          </ThemedText>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Compass (magnetometer) comes with the location feature.
        </ThemedText>
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
  bearingBox: {
    marginTop: Spacing.five,
    alignItems: 'center',
    paddingVertical: Spacing.six,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  note: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
});