import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps, type TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, MaxContentWidth } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { t } from '@/lib/i18n';

const TABS = [
  { name: 'index', label: t.tabPrayer },
  { name: 'qibla', label: t.tabQibla },
  { name: 'settings', label: t.tabSettings },
] as const;

/**
 * Web tab bar: a flat strip with a hairline on top, text labels and a short
 * mark under the active one (screens leave room for it at the bottom).
 */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          {TABS.map(({ name, label }) => (
            <TabTrigger key={name} name={name} href={`/${name === 'index' ? '' : name}`} asChild>
              <TabButton>{label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { colors } = usePhase();
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.accent : colors.textSecondary, fontFamily: isFocused ? Fonts.sansSemiBold : Fonts.sansMedium },
        ]}>
        {children}
      </Text>
      <View style={[styles.mark, { backgroundColor: isFocused ? colors.accent : 'transparent' }]} />
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { colors } = usePhase();
  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: colors.background, borderTopColor: colors.rule }]}>
      <View style={styles.row}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
  // A short bar under the active label — the page's only tab marker.
  mark: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
});
