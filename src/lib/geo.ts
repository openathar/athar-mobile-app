/** Mean Earth radius in kilometres (IUGG). */
const EARTH_RADIUS_KM = 6371.0088;

/**
 * Minimum movement before an auto-detected location counts as "moved".
 * Prayer times shift by roughly one minute per ~15-20 km east/west, so 5 km
 * is well below anything user-visible while still ignoring GPS jitter
 * (which would otherwise reschedule every alarm on every app foreground).
 */
export const LOCATION_DRIFT_KM = 5;

/** Great-circle distance between two coordinates (haversine), in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when `next` is far enough from `prev` to warrant replacing it. */
export function hasDrifted(
  prev: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
  thresholdKm: number = LOCATION_DRIFT_KM,
): boolean {
  if (!prev) return true;
  return distanceKm(prev, next) > thresholdKm;
}
