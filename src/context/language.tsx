import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform, View } from 'react-native';

import { IS_RTL, LOCALE, LOCALES, applyLocale, deviceLocale, type Locale } from '@/lib/i18n';

const isRtlLocale = (l: Locale) => l === 'ar';

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

// Dev only: EXPO_PUBLIC_FORCE_LOCALE=ar pins the device language (Expo Go reports English whatever the simulator says).
const FORCED = __DEV__ ? (process.env.EXPO_PUBLIC_FORCE_LOCALE as Locale | undefined) : undefined;
const resolve = (pref: LanguagePreference): Locale =>
  pref === 'device' ? (FORCED && LOCALES.includes(FORCED) ? FORCED : deviceLocale()) : pref;

const GUARD_KEY = 'athar.direction-reload.v1';

/**
 * Text direction. Web flips with the document; native layout direction is
 * fixed when the JS starts, so a change between Arabic and a left-to-right
 * language forces the new direction and reloads the bundle once.
 *
 * The reload happens at most ONCE per direction. Expo Go and some builds on the new architecture never
 * report the forced direction after the reload (`I18nManager.isRTL` stays as it was), and without this
 * guard the app reloaded forever and sat on the splash screen. After one failed attempt it carries on
 * and <DirectionRoot> lays the screens out in the right direction itself.
 * Resolves true when a reload is under way.
 */
async function syncDirection(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = IS_RTL ? 'rtl' : 'ltr';
      document.documentElement.lang = LOCALE;
    }
    return false;
  }
  I18nManager.allowRTL(IS_RTL);
  if (I18nManager.isRTL === IS_RTL) {
    await AsyncStorage.removeItem(GUARD_KEY).catch(() => {});
    return false;
  }
  const tried = await AsyncStorage.getItem(GUARD_KEY).catch(() => null);
  if (tried === String(IS_RTL)) return false;
  await AsyncStorage.setItem(GUARD_KEY, String(IS_RTL)).catch(() => {});
  I18nManager.forceRTL(IS_RTL);
  reloadAppAsync('language direction changed').catch(() => {});
  return true;
}

/**
 * Lays everything below out in the language's direction. Normally the native direction already matches
 * and this changes nothing; when the native side did not take the forced direction (see syncDirection)
 * it is what keeps Arabic right-to-left.
 */
export function DirectionRoot({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  return <View style={{ flex: 1, direction: isRtlLocale(locale) ? 'rtl' : 'ltr' }}>{children}</View>;
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
        syncDirection().then((reloading) => {
          if (!cancelled && !reloading) setReady(true);
        });
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
    // A new language choice earns a new attempt at the native direction.
    AsyncStorage.removeItem(GUARD_KEY)
      .catch(() => {})
      .then(() => syncDirection());
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
