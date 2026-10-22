/**
 * A small bundled city list, so the city search answers instantly and works
 * without a connection. The server lookup (GeoNames via api.openathar.org)
 * adds every other city; the two result lists are merged silently.
 */
export type BundledCity = { name: { en: string; de: string; ar: string }; country: string; latitude: number; longitude: number; timezone: string };

export const BUNDLED_CITIES: BundledCity[] = [
  { name: { en: 'Mecca', de: 'Mekka', ar: 'مكة المكرمة' }, country: 'SA', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { name: { en: 'Medina', de: 'Medina', ar: 'المدينة المنورة' }, country: 'SA', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { name: { en: 'Riyadh', de: 'Riad', ar: 'الرياض' }, country: 'SA', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { name: { en: 'Jeddah', de: 'Dschidda', ar: 'جدة' }, country: 'SA', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh' },
  { name: { en: 'Jerusalem', de: 'Jerusalem', ar: 'القدس' }, country: 'PS', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem' },
  { name: { en: 'Amman', de: 'Amman', ar: 'عمّان' }, country: 'JO', latitude: 31.9539, longitude: 35.9106, timezone: 'Asia/Amman' },
  { name: { en: 'Damascus', de: 'Damaskus', ar: 'دمشق' }, country: 'SY', latitude: 33.5138, longitude: 36.2765, timezone: 'Asia/Damascus' },
  { name: { en: 'Baghdad', de: 'Bagdad', ar: 'بغداد' }, country: 'IQ', latitude: 33.3152, longitude: 44.3661, timezone: 'Asia/Baghdad' },
  { name: { en: 'Beirut', de: 'Beirut', ar: 'بيروت' }, country: 'LB', latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut' },
  { name: { en: 'Cairo', de: 'Kairo', ar: 'القاهرة' }, country: 'EG', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { name: { en: 'Istanbul', de: 'Istanbul', ar: 'إسطنبول' }, country: 'TR', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { name: { en: 'Dubai', de: 'Dubai', ar: 'دبي' }, country: 'AE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { name: { en: 'Doha', de: 'Doha', ar: 'الدوحة' }, country: 'QA', latitude: 25.2854, longitude: 51.531, timezone: 'Asia/Qatar' },
  { name: { en: 'Tehran', de: 'Teheran', ar: 'طهران' }, country: 'IR', latitude: 35.6892, longitude: 51.389, timezone: 'Asia/Tehran' },
  { name: { en: 'Karachi', de: 'Karatschi', ar: 'كراتشي' }, country: 'PK', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { name: { en: 'Dhaka', de: 'Dhaka', ar: 'دكا' }, country: 'BD', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka' },
  { name: { en: 'Jakarta', de: 'Jakarta', ar: 'جاكرتا' }, country: 'ID', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: { en: 'Kuala Lumpur', de: 'Kuala Lumpur', ar: 'كوالالمبور' }, country: 'MY', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { name: { en: 'Casablanca', de: 'Casablanca', ar: 'الدار البيضاء' }, country: 'MA', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { name: { en: 'Lagos', de: 'Lagos', ar: 'لاغوس' }, country: 'NG', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  { name: { en: 'Berlin', de: 'Berlin', ar: 'برلين' }, country: 'DE', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { name: { en: 'Vienna', de: 'Wien', ar: 'فيينا' }, country: 'AT', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna' },
  { name: { en: 'Zurich', de: 'Zürich', ar: 'زيورخ' }, country: 'CH', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { name: { en: 'London', de: 'London', ar: 'لندن' }, country: 'GB', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { name: { en: 'Paris', de: 'Paris', ar: 'باريس' }, country: 'FR', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: { en: 'New York', de: 'New York', ar: 'نيويورك' }, country: 'US', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
];
