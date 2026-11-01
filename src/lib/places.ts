import { BUNDLED_CITIES, type BundledCity } from '@/data/cities';
import { LOCALE } from '@/lib/i18n';

/**
 * City lookup for the whole app (home "Anywhere" and the location screen).
 *
 * Two layers: the bundled list answers instantly and offline, our own API
 * (GeoNames data, `api.openathar.org`) covers every other city above 15,000
 * people. No third-party geocoder ever sees a query — that is the point of
 * the privacy promise, so Nominatim is not an option here.
 */
export const PLACES_API = 'https://api.openathar.org';

export type Place = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  /** UTC offset returned by the API; only a fallback when the zone data is missing. */
  utcOffsetHours: number;
};

const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function placeFromCity(city: BundledCity): Place {
  return {
    name: city.name[LOCALE],
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    utcOffsetHours: 0,
  };
}

/** Every bundled city, in the app's language — the offline shortlist. */
export function bundledPlaces(): Place[] {
  return BUNDLED_CITIES.map(placeFromCity);
}

/**
 * The place's UTC offset right now, from its IANA zone (daylight saving
 * included); falls back to the stored value. Prayer times are wall-clock
 * times, so the offset is needed before the calculator sees a date.
 */
export function offsetHoursNow(zone: string, fallback = 0): number {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    const m = part?.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (m) return (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60);
  } catch {
    // zone data missing on this runtime
  }
  return fallback;
}

/** Bundled cities that match the query in any of the three languages — instant and offline. */
export function matchLocal(query: string, limit = 5): Place[] {
  const needle = fold(query.trim());
  return BUNDLED_CITIES.filter((c) => Object.values(c.name).some((n) => fold(n).includes(needle)))
    .map(placeFromCity)
    .slice(0, limit);
}

const dedupe = (local: Place[], remote: Place[]) =>
  remote.filter((r) => !local.some((l) => l.latitude.toFixed(1) === r.latitude.toFixed(1) && l.longitude.toFixed(1) === r.longitude.toFixed(1)));

/**
 * Local matches plus the server's answer, merged. `remoteFailed` says only
 * that the API could not be reached — the local list still stands, so the
 * caller never has to tell the user about a network it did not need.
 */
export async function searchPlaces(query: string, limit = 6): Promise<{ places: Place[]; remoteFailed: boolean }> {
  const local = matchLocal(query, limit);
  try {
    const res = await fetch(`${PLACES_API}/v1/places?limit=${limit}&q=${encodeURIComponent(query.trim())}`);
    const data = (await res.json()) as { places?: Place[] };
    const remote = data.places ?? [];
    return { places: [...local, ...dedupe(local, remote)].slice(0, limit), remoteFailed: false };
  } catch {
    return { places: local, remoteFailed: true };
  }
}
