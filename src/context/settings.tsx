import AsyncStorage from '@react-native-async-storage/async-storage';
import { Methods, type Method } from '@openathar/athan-core-ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** The calculation methods the app offers, in the order the picker shows them. */
export const METHOD_KEYS = ['MWL', 'ISNA', 'EGYPT', 'MAKKAH', 'KARACHI', 'TEHRAN'] as const;
export type MethodKey = (typeof METHOD_KEYS)[number];

const STORAGE_KEY = 'athar.settings.v1';

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
};

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * User choices that shape the calculation itself. Today that is the
 * calculation method; prayer times, alarms, "Anywhere" and the countdown
 * all read it from here, so changing it once changes the whole app.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [method, setMethodState] = useState<MethodKey>(defaultMethod);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled || !v) return;
        const stored = (JSON.parse(v) as { method?: MethodKey }).method;
        if (stored && METHOD_KEYS.includes(stored)) setMethodState(stored);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setMethod = useCallback((key: MethodKey) => {
    setMethodState(key);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ method: key })).catch(() => {});
  }, []);

  const value = useMemo<SettingsValue>(() => ({ method, calculator: Methods[method], setMethod }), [method, setMethod]);

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
