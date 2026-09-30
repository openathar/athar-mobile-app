import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useLocationContext } from '@/context/location';
import type { PrayerKey } from '@/hooks/use-prayer';
import {
  ALL_ALARMS_ON,
  checkNotificationPermission,
  ensureNotificationPermission,
  schedulePrayerAlarms,
  type AlarmSettings,
} from '@/lib/alarms';

const STORAGE_KEY = 'athar.alarms.v1';

export type AlarmPermission = 'unknown' | 'granted' | 'denied';

type AlarmsContextValue = {
  enabled: AlarmSettings;
  toggle: (key: PrayerKey) => Promise<void>;
  permission: AlarmPermission;
};

const AlarmsContext = createContext<AlarmsContextValue | null>(null);

/**
 * Adhan alarm state: persisted per-prayer toggles, permission handling, and
 * rescheduling whenever settings or location change. Times are computed
 * inside (7 days ahead), so only the location — never a times snapshot —
 * is an input. Rescheduling also runs on every app foreground, which keeps
 * the 7-day window fresh without any timer and picks up a timezone change
 * (the window is recomputed from the device clock each time).
 *
 * This lives at the app root, not on the Settings screen: alarms must be
 * (re)scheduled for every user on every launch, including those who never
 * open Settings in that session.
 * Web is a no-op — notifications are native-only.
 */
export function AlarmsProvider({ children }: { children: ReactNode }) {
  const { location } = useLocationContext();
  const [enabled, setEnabled] = useState<AlarmSettings>(ALL_ALARMS_ON);
  const [permission, setPermission] = useState<AlarmPermission>('unknown');
  const [foregroundCount, setForegroundCount] = useState(0);
  // Nothing may be persisted or scheduled from the ALL_ALARMS_ON default
  // before the stored toggles are known, or a user who disabled a prayer
  // would get it re-enabled on every launch.
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings + current permission once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await checkNotificationPermission();
      const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (cancelled) return;
      setPermission(granted ? 'granted' : 'denied');
      if (stored) setEnabled((prev) => ({ ...prev, ...(JSON.parse(stored) as Partial<AlarmSettings>) }));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reschedule on every foreground — refreshes the 7-day window.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundCount((n) => n + 1);
    });
    return () => subscription.remove();
  }, []);

  // Persist + reschedule when settings, location, or foreground change.
  const locationKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
  useEffect(() => {
    if (!loaded || permission !== 'granted') return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
    schedulePrayerAlarms(location.lat, location.lng, enabled).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locationKey, foregroundCount, permission, loaded]);

  const toggle = useCallback(
    async (key: PrayerKey) => {
      if (permission !== 'granted') {
        const granted = await ensureNotificationPermission();
        setPermission(granted ? 'granted' : 'denied');
        if (!granted) return;
      }
      setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [permission]
  );

  const value = useMemo<AlarmsContextValue>(
    () => ({ enabled, toggle, permission }),
    [enabled, toggle, permission]
  );

  return <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>;
}

export function useAlarmsContext(): AlarmsContextValue {
  const value = useContext(AlarmsContext);
  if (!value) throw new Error('useAlarmsContext must be used within AlarmsProvider');
  return value;
}
