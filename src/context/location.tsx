import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { DEFAULT_LOCATION } from '@/constants/location';
import { hasDrifted } from '@/lib/geo';

export type GeoLocation = { lat: number; lng: number; label: string };
export type LocationStatus = 'loading' | 'ready' | 'denied';

const STORAGE_KEY = 'athar.location.v1';

type LocationContextValue = {
  location: GeoLocation;
  status: LocationStatus;
  /** Persist a manually chosen location; `null` falls back to auto-detect. */
  setCustom: (loc: GeoLocation | null) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Single source of truth for the app's location: a manually chosen city
 * (Settings → Location) wins; otherwise auto-detected; otherwise Berlin.
 * Persisted across restarts.
 *
 * The auto-detected position is re-read on every app foreground (travel
 * without restarting the app), but only replaced when it moved more than
 * LOCATION_DRIFT_KM — GPS jitter must not reschedule every alarm.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [custom, setCustomState] = useState<GeoLocation | null>(null);
  const [auto, setAuto] = useState<GeoLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [foregroundCount, setForegroundCount] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundCount((n) => n + 1);
    });
    return () => subscription.remove();
  }, []);

  // Load a persisted custom location once.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled || !v) return;
        setCustomState(JSON.parse(v) as GeoLocation);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-detect only when no custom location is set.
  useEffect(() => {
    if (custom) {
      setStatus('ready');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Prompt only on the first attempt; on later foregrounds just read the
        // current grant so a returning user is never nagged again.
        const { status: perm } =
          foregroundCount === 0
            ? await Location.requestForegroundPermissionsAsync()
            : await Location.getForegroundPermissionsAsync();
        if (perm !== 'granted') {
          if (!cancelled) setStatus('denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current location' };
        setAuto((prev) => (hasDrifted(prev, next) ? next : prev));
        setStatus('ready');
      } catch {
        // Keep a previously detected position rather than dropping to the
        // Berlin fallback because one refresh failed (e.g. no GPS fix indoors).
        if (!cancelled) setStatus((prev) => (prev === 'ready' ? prev : 'denied'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [custom, foregroundCount]);

  const setCustom = useCallback((loc: GeoLocation | null) => {
    setCustomState(loc);
    if (loc) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc)).catch(() => {});
    else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({ location: custom ?? auto ?? DEFAULT_LOCATION, status, setCustom }),
    [custom, auto, status, setCustom]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useLocationContext must be used within LocationProvider');
  return value;
}