import { Pressable, StyleSheet, View } from 'react-native';

import { usePhase } from '@/context/phase';

/**
 * The app's own switch: a flat pill drawn from the palette, no OS styling
 * (the platform switch brought its own green and a shadow into a page that
 * has neither). The knob sits at the start when off, at the end when on —
 * `justifyContent` instead of a transform, so it mirrors in RTL.
 */
export function Switch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: () => void;
  label?: string;
}) {
  const { colors } = usePhase();
  return (
    <Pressable
      onPress={onChange}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.track,
        {
          borderColor: value ? colors.accent : colors.rule,
          backgroundColor: value ? colors.accent : 'transparent',
          justifyContent: value ? 'flex-end' : 'flex-start',
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.knob, { backgroundColor: value ? colors.background : colors.textSecondary }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    alignItems: 'center',
    flexDirection: 'row',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});
