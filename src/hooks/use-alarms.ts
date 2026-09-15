import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ALL_ALARMS_ON,
  checkNotificationPermission,
  ensureNotificationPermission,
  schedulePrayerAlarms,
  type AlarmSettings,
} from '@/lib/alarms';
import { PRAYER_ORDER, type PrayerKey } from '@/hooks/use-prayer';

const STORAGE_KEY = 'athar.alarms.v1';

export type AlarmPermission = 'unknown' | 'granted' | 'denied';

/**
 * Adhan alarm state: persisted per-prayer toggles, permission handling, and
 * rescheduling whenever settings or prayer times (location/day) change.
 * Web is a no-op — notifications are native-only.
 */
export function useAlarms(times: Record<PrayerKey, number>) {
  const [enabled, setEnabled] = useState<AlarmSettings>(ALL_ALARMS_ON);
  const [permission, setPermission] = useState<AlarmPermission>('unknown');

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

  // Persist + reschedule when settings or times change (times are stable
  // per location/day, so this only fires on real changes).
  const timesKey = useMemo(() => PRAYER_ORDER.map((k) => times[k]).join(','), [times]);
  useEffect(() => {
    if (permission !== 'granted') return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
    schedulePrayerAlarms(times, enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timesKey, permission]);

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