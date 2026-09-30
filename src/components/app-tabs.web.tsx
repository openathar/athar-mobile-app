import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps, type TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Khatam } from './khatam';

import { Fonts, MaxContentWidth } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { withAlpha } from '@/lib/color';

const TABS = [
  { name: 'index', label: 'Prayer' },
  { name: 'qibla', label: 'Qibla' },
  { name: 'settings', label: 'Settings' },
] as const;

/**
 * Web tab bar: a frosted capsule floating over the sky (screens leave room
 * for it at the bottom), in the same day-phase palette as everything else.
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
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButton, isFocused && { backgroundColor: withAlpha(colors.accent, 0.16) }]}>
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? colors.accent : colors.textSecondary, fontFamily: isFocused ? Fonts.sansSemiBold : Fonts.sansMedium },
          ]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { colors } = usePhase();
  return (
    <View {...props} style={styles.tabListContainer} pointerEvents="box-none">
      <View
        style={[
          styles.capsule,
          { backgroundColor: withAlpha(colors.surface, 0.9), borderColor: withAlpha(colors.rule, 0.95) },
        ]}>
        <Khatam size={20} color={colors.stars[0]} opacity={0.9} duration={60000} />
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    alignItems: 'center',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 14,
  },
});
