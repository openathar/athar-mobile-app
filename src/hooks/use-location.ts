import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { DEFAULT_LOCATION } from '@/constants/location';

export type GeoLocation = { lat: number; lng: number; label: string };
export type LocationStatus = 'loading' | 'ready' | 'denied';

/**
 * Foreground location with graceful fallback: permission denied or error
 * (e.g. web without geolocation) → DEFAULT_LOCATION (Berlin).
 */
export function useLocation(): { location: GeoLocation; status: LocationStatus } {
  const [state, setState] = useState<{ location: GeoLocation; status: LocationStatus }>({
    location: DEFAULT_LOCATION,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ location: DEFAULT_LOCATION, status: 'denied' });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setState({
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current location' },
            status: 'ready',
          });
        }
      } catch {
        if (!cancelled) setState({ location: DEFAULT_LOCATION, status: 'denied' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}