import { Platform } from 'react-native';

/**
 * The app's clock. In development on web, `?at=HH:MM` pins the clock to that
 * local time today (it keeps ticking from there), so every screen — sky,
 * sun/moon, sphere, countdown — can be previewed at dawn, noon or dusk
 * without waiting. Production builds always use the real time.
 */
let offsetMs = 0;

if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
  const at = new URLSearchParams(window.location.search).get('at');
  const m = at ? /^(\d{1,2}):(\d{2})$/.exec(at) : null;
  if (m) {
    const target = new Date();
    target.setHours(Number(m[1]), Number(m[2]), 0, 0);
    offsetMs = target.getTime() - Date.now();
  }
}

export function clockNow(): Date {
  return new Date(Date.now() + offsetMs);
}
