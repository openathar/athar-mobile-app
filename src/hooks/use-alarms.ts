import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  ALL_ALARMS_ON,
  checkNotificationPermission,
  ensureNotificationPermission,
  schedulePrayerAlarms,
  type AlarmSettings,
} from '@/lib/alarms';
import type { PrayerKey } from '@/hooks/use-prayer';

const STORAGE_KEY = 'athar.alarms.v1';

export type AlarmPermission = 'unknown' | 'granted' | 'denied';

/**
 * Adhan alarm state: persisted per-prayer toggles, permission handling, and
 * rescheduling whenever settings or location change. Times are computed
 * inside (7 days ahead), so only the location — never a times snapshot —
 * is an input. Rescheduling also runs on every app foreground, which keeps
 * the 7-day window fresh without any timer.
 * Web is a no-op — notifications are native-only.
 */
export function useAlarms(location: { lat: number; lng: number }) {
  const [enabled, setEnabled] = useState<AlarmSettings>(ALL_ALARMS_ON);
  const [permission, setPermission] = useState<AlarmPermission>('unknown');
  const [foregroundCount, setForegroundCount] = useState(0);

  // Load persisted settings + current permission once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await checkNotificationPermission();
      if (cancelled) return;
      setPermission(granted ? 'granted' : 'denied');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (cancelled || !stored) return;
      setEnabled((prev) => ({ ...prev, ...(JSON.parse(stored) as Partial<AlarmSettings>) }));
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
    if (permission !== 'granted') return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
    schedulePrayerAlarms(location.lat, location.lng, enabled).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locationKey, foregroundCount, permission]);

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

  return { enabled, toggle, permission };
}
