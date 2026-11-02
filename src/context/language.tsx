import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { IS_RTL, LOCALE, LOCALES, applyLocale, deviceLocale, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'athar.language.v1';

/** `device` follows the phone's language; anything else is a fixed choice. */
export type LanguagePreference = 'device' | Locale;

type LanguageValue = {
  preference: LanguagePreference;
  /** The language actually in use (the device language resolved). */
  locale: Locale;
  setPreference: (pref: LanguagePreference) => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

const resolve = (pref: LanguagePreference): Locale => (pref === 'device' ? deviceLocale() : pref);

/**
 * Text direction. Web flips with the document; native layout direction is
 * fixed when the JS starts, so a change between Arabic and a left-to-right
 * language forces the new direction and reloads the bundle once.
 * Returns true when a reload is under way.
 */
function syncDirection(): boolean {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = IS_RTL ? 'rtl' : 'ltr';
      document.documentElement.lang = LOCALE;
    }
    return false;
  }
  I18nManager.allowRTL(IS_RTL);
  if (I18nManager.isRTL === IS_RTL) return false;
  I18nManager.forceRTL(IS_RTL);
  reloadAppAsync('language direction changed').catch(() => {});
  return true;
}

/**
 * The app's language: the phone's by default, or the one picked in Settings
 * (persisted). Children render only once the stored choice is known.
 * The screens sit inside <LocaleBoundary>, keyed by the language: the
 * providers above (location, method, alarms) keep their state, the screens
 * re-mount and read the new strings — including memoised ones, which the
 * React Compiler would otherwise keep (it treats module imports like `t` as
 * constants).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<LanguagePreference>('device');
  const [locale, setLocale] = useState<Locale>(LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((stored) => {
        if (cancelled) return;
        const pref: LanguagePreference =
          stored && (stored === 'device' || (LOCALES as readonly string[]).includes(stored)) ? (stored as LanguagePreference) : 'device';
        const next = resolve(pref);
        applyLocale(next);
        setPref(pref);
        setLocale(next);
        if (!syncDirection()) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((pref: LanguagePreference) => {
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
    const next = resolve(pref);
    applyLocale(next);
    setPref(pref);
    setLocale(next);
    syncDirection();
  }, []);

  const value = useMemo<LanguageValue>(() => ({ preference, locale, setPreference }), [preference, locale, setPreference]);

  if (!ready) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Re-mounts everything below when the language changes. */
export function LocaleBoundary({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  return <Fragment key={locale}>{children}</Fragment>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
