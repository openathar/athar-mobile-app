import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';

const ROWS = [
  { label: 'Location', hint: 'Berlin — change to your city' },
  { label: 'Adhan alarms', hint: 'Local notifications, never push' },
  { label: 'Calculation method', hint: 'Muslim World League' },
  { label: 'Theme', hint: 'Follows your device' },
  { label: 'About', hint: 'Athar — openathar.org' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.display }]}>Settings</Text>
        <Text style={[styles.sub, { color: colors.textSecondary, fontFamily: Fonts.sans }]}>
          Coming with the next milestones.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          {ROWS.map((row, i) => (
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
  card: {
    marginTop: Spacing.four,
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
});