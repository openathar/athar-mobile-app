import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { usePhase } from '@/context/phase';
import { withAlpha } from '@/lib/color';

/** Native tab bar in the same day-phase palette as the screens above it. */
export default function AppTabs() {
  const { colors } = usePhase();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={withAlpha(colors.accent, 0.18)}
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Prayer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="clock-outline" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="qibla">
        <NativeTabs.Trigger.Label>Qibla</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="compass-outline" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="cog-outline" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}