import AsyncStorage from '@react-native-async-storage/async-storage';
import { Methods, type Method } from '@openathar/athan-core-ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useLocationContext } from '@/context/location';
import { methodForPlace, methodForZone } from '@/lib/method-for-place';

/** The calculation methods the app offers, in the order the picker shows them. */
export const METHOD_KEYS = ['MWL', 'ISNA', 'EGYPT', 'MAKKAH', 'KARACHI', 'TEHRAN', 'MALAYSIA', 'SINGAPORE', 'FRANCE', 'RUSSIA'] as const;
export type MethodKey = (typeof METHOD_KEYS)[number];

const STORAGE_KEY = 'athar.settings.v1';

/**
 * Page colour themes. The two sun themes follow the real sun through the
 * day (lib/sky.ts) and differ only at Maghrib; the others hold one stone.
 */
// Order of the picker: the website's night first (the default), the sun themes last.
export const THEME_KEYS = ['obsidian', 'lapis', 'porcelain', 'sunGarnet', 'sunEmerald'] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

/** The fixed colour of a one-stone theme, or null for the sun themes. */
export const FIXED_THEME_COLOR: Record<ThemeKey, string | null> = {
  sunGarnet: null,
  sunEmerald: null,
  obsidian: '#0b0f17', // exactly the website's night (--lp-bg)
  lapis: '#152457',
  porcelain: '#f6f6f3',
};

type Stored = { method?: MethodKey; theme?: ThemeKey };

type SettingsValue = {
  /** Which convention the times are computed with. */
  method: MethodKey;
  /** True while the method follows the place (nobody picked one by hand). */
  methodIsAuto: boolean;
  /** The method's parameters, ready for the calculator. */
  calculator: Method;
  /** A hand-picked method, or 'auto' to follow the place again. */
  setMethod: (key: MethodKey | 'auto') => void;
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * User choices: the page colour theme and the calculation method. The method prayer times, alarms, "Anywhere" and the countdown
 * all read it from here, so changing it once changes the whole app.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  // null = automatic: the method that fits the place (lib/method-for-place.ts).
  const [chosen, setChosen] = useState<MethodKey | null>(null);
  const { location, status } = useLocationContext();
  const [theme, setThemeState] = useState<ThemeKey>('obsidian');
  // Both choices live in one stored object; keep the latest to write it whole.
  const stored = useRef<Stored>({});

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled || !v) return;
        const data = JSON.parse(v) as Stored;
        stored.current = data;
        if (data.method && METHOD_KEYS.includes(data.method)) setChosen(data.method);
        if (data.theme && THEME_KEYS.includes(data.theme)) setThemeState(data.theme);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setMethod = useCallback((key: MethodKey | 'auto') => {
    const next = key === 'auto' ? null : key;
    setChosen(next);
    const { method: _old, ...rest } = stored.current;
    stored.current = next ? { ...rest, method: next } : rest;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored.current)).catch(() => {});
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeState(key);
    stored.current = { ...stored.current, theme: key };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored.current)).catch(() => {});
  }, []);

  // Without a real position (permission denied, Berlin fallback) the time zone is the better hint.
  const auto = useMemo<MethodKey>(() => {
    if (status === 'denied' && !location.country) {
      let zone: string | undefined;
      try {
        zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // no Intl zone data on this runtime
      }
      return methodForZone(zone);
    }
    return methodForPlace(location);
  }, [location, status]);
  const method = chosen ?? auto;

  const value = useMemo<SettingsValue>(
    () => ({ method, methodIsAuto: chosen === null, calculator: Methods[method], setMethod, theme, setTheme }),
    [method, chosen, setMethod, theme, setTheme]
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
