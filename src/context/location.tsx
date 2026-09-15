import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_LOCATION } from '@/constants/location';

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
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [custom, setCustomState] = useState<GeoLocation | null>(null);
  const [auto, setAuto] = useState<GeoLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');

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
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
          if (!cancelled) setStatus('denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setAuto({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current location' });
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [custom]);

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