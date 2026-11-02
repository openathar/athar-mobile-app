import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps, type TabListProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, MaxContentWidth } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { t } from '@/lib/i18n';

/** Read at render time — the language can change while the app runs. */
const tabs = () => [
  { name: 'index', label: t.tabPrayer },
  { name: 'qibla', label: t.tabQibla },
  { name: 'sky', label: t.tabSky },
  { name: 'feelings', label: t.tabFeelings },
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
          {tabs().map(({ name, label }) => (
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
  // react-native 0.88 declares `View` as a function component, so the slot's
  // `RefAttributes<View>` no longer matches the `ReactNativeElement` ref that
  // Pressable takes. Same object at runtime — only the ref type differs.
  const pressable = props as ComponentProps<typeof Pressable>;
  return (
    <Pressable {...pressable} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
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
    minWidth: 0,
    paddingHorizontal: 2,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
  },
  // A short bar under the active label — the page's only tab marker.
  mark: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
});
