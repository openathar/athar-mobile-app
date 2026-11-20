import type { PrayerKey } from '@/hooks/use-prayer';
import { LOCALE, PRAYER_KEYS, t } from '@/lib/i18n';

export const ARABIC_PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

/** Latin name in the device language plus its Arabic twin (the Arabic UI shows the Arabic name once). */
export const prayerName = (key: PrayerKey) => ({
  primary: t[PRAYER_KEYS[key]],
  twin: LOCALE === 'ar' ? null : ARABIC_PRAYER_NAMES[key],
});
