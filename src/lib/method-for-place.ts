import type { MethodKey } from '@/context/settings';

/**
 * Which calculation convention fits a place best, decided on the device — no geocoder, no network.
 *
 * A chosen city carries its country code, which decides directly. A GPS position has none (the
 * app never sends coordinates to a reverse geocoder), so it falls back to rough regions. Both
 * name the convention the local authorities and mosques there use, or the nearest one the app
 * offers: Türkiye's Diyanet and Malaysia's JAKIM are not in the table, so Türkiye gets the
 * Muslim World League and South-East Asia the Egyptian angles (19.5°/17.5°, closest to JAKIM's
 * 20°/18°).
 */
const BY_COUNTRY: Record<string, MethodKey> = {
  // Arabian Peninsula: Umm al-Qura
  SA: 'MAKKAH', AE: 'MAKKAH', QA: 'MAKKAH', KW: 'MAKKAH', BH: 'MAKKAH', OM: 'MAKKAH', YE: 'MAKKAH',
  // Egypt, the Levant, Iraq, Sudan, Libya, Morocco: Egyptian General Authority
  EG: 'EGYPT', SD: 'EGYPT', LY: 'EGYPT', SY: 'EGYPT', LB: 'EGYPT', JO: 'EGYPT', PS: 'EGYPT', IQ: 'EGYPT',
  MA: 'EGYPT',
  // South-East Asia: JAKIM (20°/18°; Indonesia's Kemenag and Brunei use the same angles), MUIS
  MY: 'MALAYSIA', ID: 'MALAYSIA', BN: 'MALAYSIA', SG: 'SINGAPORE',
  // France: UOIF (12°), the convention most French mosques print
  FR: 'FRANCE',
  // Russia: the Spiritual Administration of Muslims
  RU: 'RUSSIA',
  // South Asia: Karachi
  PK: 'KARACHI', IN: 'KARACHI', BD: 'KARACHI', AF: 'KARACHI', LK: 'KARACHI', NP: 'KARACHI',
  // Iran: Tehran
  IR: 'TEHRAN',
  // North America: ISNA
  US: 'ISNA', CA: 'ISNA',
};

type Box = { lat: [number, number]; lng: [number, number]; method: MethodKey };

/** Rough boxes, checked in order (the first match wins, so the tighter ones come first). */
const REGIONS: Box[] = [
  // Iran, cut around its neighbours: the Gulf coast states below 26.5°, Iraq and Kuwait west of 48.5°.
  { lat: [26.5, 40], lng: [48.5, 63.5], method: 'TEHRAN' },
  { lat: [35, 39.8], lng: [45.5, 48.5], method: 'TEHRAN' }, // north-west (Tabriz)
  { lat: [25, 26.5], lng: [57.5, 63.5], method: 'TEHRAN' }, // south-east coast (Chabahar)
  { lat: [5, 38], lng: [60.5, 92.7], method: 'KARACHI' }, // Afghanistan, Pakistan, India, Bangladesh, Sri Lanka
  { lat: [29.5, 37.5], lng: [34, 48.6], method: 'EGYPT' }, // Levant and Iraq
  { lat: [12, 29.5], lng: [36, 60], method: 'MAKKAH' }, // Arabian Peninsula
  { lat: [8, 31.7], lng: [24.7, 36], method: 'EGYPT' }, // Egypt and Sudan
  { lat: [1.15, 1.48], lng: [103.6, 104.1], method: 'SINGAPORE' }, // Singapore
  { lat: [-11, 7.5], lng: [95, 141], method: 'MALAYSIA' }, // Malaysia, Indonesia, Brunei
  { lat: [14, 72], lng: [-170, -50], method: 'ISNA' }, // North America
];

export function methodForPlace(place: { lat: number; lng: number; country?: string }): MethodKey {
  const byCountry = place.country ? BY_COUNTRY[place.country.toUpperCase()] : undefined;
  if (byCountry) return byCountry;
  if (place.country) return 'MWL'; // a known country without its own convention (Europe, Türkiye, …)
  for (const r of REGIONS) {
    if (place.lat >= r.lat[0] && place.lat <= r.lat[1] && place.lng >= r.lng[0] && place.lng <= r.lng[1]) return r.method;
  }
  return 'MWL';
}

/**
 * A guess from the device's time zone, for when there is no real position (location denied, the
 * Berlin fallback is showing): Riyadh → Umm al-Qura, Cairo → Egyptian, the Americas → ISNA.
 */
export function methodForZone(zone: string | undefined): MethodKey {
  if (!zone) return 'MWL';
  if (zone === 'Asia/Riyadh') return 'MAKKAH';
  if (zone === 'Africa/Cairo') return 'EGYPT';
  if (/^Asia\/(Karachi|Kolkata|Dhaka|Colombo|Kathmandu|Kabul)$/.test(zone)) return 'KARACHI';
  if (zone === 'Asia/Tehran') return 'TEHRAN';
  if (zone.startsWith('America/')) return 'ISNA';
  return 'MWL';
}
