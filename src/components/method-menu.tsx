import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { usePhase } from '@/context/phase';
import { METHOD_KEYS, useSettingsContext, type MethodKey } from '@/context/settings';
import { IS_RTL, t } from '@/lib/i18n';
import { methodNames } from '@/lib/method-names';

const MENU_WIDTH = 280;
/** Rough height of one row (48 min + hint line); only used to place the menu. */
const ROW_H = 52;

/**
 * One small line under the countdown: the calculation method in use and a small button that opens
 * a menu right there — "Automatic" (the method that fits the place) or any of the conventions.
 */
export function MethodLine() {
  const { colors } = usePhase();
  const { method, methodIsAuto, setMethod } = useSettingsContext();
  const { width: screenW, height: screenH } = useWindowDimensions();
  // `any`, as in screen.tsx: RN 0.88's Pressable ref type no longer matches `View`.
  const anchor = useRef<any>(null);
  const [menuAt, setMenuAt] = useState<{ top: number; left: number } | null>(null);
  // Eleven rows do not fit every phone: the menu scrolls inside this height.
  const menuH = Math.min((METHOD_KEYS.length + 1) * ROW_H, screenH - 200);

  const open = () => {
    anchor.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
      const left = Math.max(16, Math.min(IS_RTL ? x + w - MENU_WIDTH : x, screenW - MENU_WIDTH - 16));
      // Below the button; above it when it would run off the screen; else centred, clear of the tab bar.
      const below = y + h + 6;
      const above = y - menuH - 6;
      const top = below + menuH + 16 <= screenH ? below : above >= 48 ? above : Math.max(48, (screenH - menuH) / 2 - 24);
      setMenuAt({ top, left });
    });
  };
  const close = () => setMenuAt(null);
  const pick = (key: MethodKey | 'auto') => {
    setMethod(key);
    close();
  };

  const names = methodNames();
  const options: { key: MethodKey | 'auto'; label: string; hint?: string; selected: boolean }[] = [
    { key: 'auto', label: t.methodAuto, hint: `${t.methodAutoHint} · ${names[method]}`, selected: methodIsAuto },
    ...METHOD_KEYS.map((key) => ({ key, label: names[key], selected: !methodIsAuto && key === method })),
  ];

  return (
    <View style={styles.line}>
      <Text style={[styles.text, { color: colors.textSecondary, fontFamily: Fonts.sans }]} numberOfLines={1}>
        {names[method]}
        {methodIsAuto ? ` · ${t.methodAuto}` : ''}
      </Text>
      <Pressable
        ref={anchor}
        onPress={open}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t.methodChange}
        style={({ pressed }) => [styles.button, { borderColor: colors.rule }, pressed && styles.pressed]}>
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path d="M2.5 4.5L6 8l3.5-3.5" stroke={colors.accent} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <Modal visible={menuAt !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t.methodChange} />
        {menuAt ? (
          <ScrollView
            accessibilityRole="menu"
            style={[styles.menu, { top: menuAt.top, left: menuAt.left, maxHeight: menuH, backgroundColor: colors.background, borderColor: colors.rule }]}
            contentContainerStyle={styles.menuContent}>
            {options.map((o, i) => (
              <Pressable
                key={o.key}
                onPress={() => pick(o.key)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: o.selected }}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && { borderTopColor: colors.rule, borderTopWidth: StyleSheet.hairlineWidth },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.itemText}>
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: o.selected ? colors.accent : colors.text, fontFamily: o.selected ? Fonts.sansMedium : Fonts.sans, textAlign: IS_RTL ? 'right' : 'left' },
                    ]}>
                    {o.label}
                  </Text>
                  {o.hint ? (
                    <Text style={[styles.itemHint, { color: colors.textSecondary, fontFamily: Fonts.sans, textAlign: IS_RTL ? 'right' : 'left' }]}>
                      {o.hint}
                    </Text>
                  ) : null}
                </View>
                {o.selected ? (
                  <Svg width={14} height={14} viewBox="0 0 14 14">
                    <Path d="M2.5 7.5l3 3 6-7" stroke={colors.accent} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    maxWidth: '100%',
  },
  text: {
    fontSize: 13,
    flexShrink: 1,
  },
  button: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
  },
  menuContent: {
    paddingHorizontal: 16,
  },
  item: {
    minHeight: 48,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 15,
  },
  itemHint: {
    fontSize: 12,
  },
});
