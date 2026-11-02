import AsyncStorage from '@react-native-async-storage/async-storage';
import { Methods, type Method } from '@openathar/athan-core-ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** The calculation methods the app offers, in the order the picker shows them. */
export const METHOD_KEYS = ['MWL', 'ISNA', 'EGYPT', 'MAKKAH', 'KARACHI', 'TEHRAN'] as const;
export type MethodKey = (typeof METHOD_KEYS)[number];

const STORAGE_KEY = 'athar.settings.v1';

/**
 * Page colour themes. The two sun themes follow the real sun through the
 * day (lib/sky.ts) and differ only at Maghrib; the others hold one stone.
 */
export const THEME_KEYS = ['sunGarnet', 'sunEmerald', 'obsidian', 'lapis', 'porcelain'] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

/** The fixed colour of a one-stone theme, or null for the sun themes. */
export const FIXED_THEME_COLOR: Record<ThemeKey, string | null> = {
  sunGarnet: null,
  sunEmerald: null,
  obsidian: '#0a0d14',
  lapis: '#152457',
  porcelain: '#f6f6f3',
};

type Stored = { method?: MethodKey; theme?: ThemeKey };

/**
 * A first guess from the device's time zone (no location prompt, no network):
 * a user in Riyadh starts on Umm al-Qura, in Cairo on the Egyptian method,
 * in North America on ISNA — everyone else on the Muslim World League
 * convention the site uses too.
 */
function defaultMethod(): MethodKey {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone === 'Asia/Riyadh') return 'MAKKAH';
    if (zone === 'Africa/Cairo') return 'EGYPT';
    if (/^Asia\/(Karachi|Kolkata|Dhaka|Colombo|Kathmandu|Kabul)$/.test(zone)) return 'KARACHI';
    if (zone === 'Asia/Tehran') return 'TEHRAN';
    if (zone.startsWith('America/')) return 'ISNA';
  } catch {
    // no Intl zone data on this runtime
  }
  return 'MWL';
}

type SettingsValue = {
  /** Which convention the times are computed with. */
  method: MethodKey;
  /** The method's parameters, ready for the calculator. */
  calculator: Method;
  setMethod: (key: MethodKey) => void;
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * User choices: the page colour theme and the calculation method. The method prayer times, alarms, "Anywhere" and the countdown
 * all read it from here, so changing it once changes the whole app.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [method, setMethodState] = useState<MethodKey>(defaultMethod);
  const [theme, setThemeState] = useState<ThemeKey>('sunGarnet');
  // Both choices live in one stored object; keep the latest to write it whole.
  const stored = useRef<Stored>({});

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled || !v) return;
        const data = JSON.parse(v) as Stored;
        stored.current = data;
        if (data.method && METHOD_KEYS.includes(data.method)) setMethodState(data.method);
        if (data.theme && THEME_KEYS.includes(data.theme)) setThemeState(data.theme);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setMethod = useCallback((key: MethodKey) => {
    setMethodState(key);
    stored.current = { ...stored.current, method: key };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored.current)).catch(() => {});
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeState(key);
    stored.current = { ...stored.current, theme: key };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored.current)).catch(() => {});
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({ method, calculator: Methods[method], setMethod, theme, setTheme }),
    [method, setMethod, theme, setTheme]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used inside SettingsProvider');
  return ctx;
}

/** "Fajr 18° · Isha 17°" — the method's parameters, language-neutral. */
export function methodParams(key: MethodKey): string {
  const m = Methods[key];
  const isha = m.isha.kind === 'angle' ? `Isha ${m.isha.degrees}°` : `Isha +${m.isha.minutes} min`;
  return `Fajr ${m.fajr}° · ${isha}`;
}
