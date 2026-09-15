import { useLocationContext } from '@/context/location';

/** Convenience hook — reads the shared location state (see LocationProvider). */
export function useLocation() {
  return useLocationContext();
}