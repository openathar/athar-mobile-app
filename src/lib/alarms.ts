import { Methods, PrayerTimes } from '@openathar/athan-core-ts';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PRAYER_ORDER, type PrayerKey } from '@/hooks/use-prayer';

export type AlarmSettings = Record<PrayerKey, boolean>;

export const ALL_ALARMS_ON: AlarmSettings = Object.fromEntries(
  PRAYER_ORDER.map((key) => [key, true])
) as AlarmSettings;

const CHANNEL_ID = 'adhan';

const PRAYER_TITLES: Record<PrayerKey, { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};

/** Foreground notifications should still alert (banner + sound). */
export function configureNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Adhan alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
  }).catch(() => {});
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Read-only permission check (no prompt). */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/**
 * Days scheduled ahead. 7 matches the iOS local-notification refresh window
 * (BGAppRefreshTask) and keeps the pending count (≤42) under the iOS 64 limit.
 */
export const SCHEDULE_DAYS_AHEAD = 7;

/**
 * Replace all scheduled alarms with one-shot DATE triggers for the enabled
 * prayers, computed per day for the next SCHEDULE_DAYS_AHEAD days. Per-day
 * computation matters because prayer times shift daily — a repeating DAILY
 * trigger would freeze today's times forever. Returns the scheduled count.
 * Web is a no-op (notifications are native-only).
 */
export async function schedulePrayerAlarms(
  lat: number,
  lng: number,
  enabled: AlarmSettings,
  now: Date = new Date(),
): Promise<number> {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const nowMs = now.getTime();
  const calculator = new PrayerTimes(Methods.MWL);
  let scheduled = 0;
  for (let offset = 0; offset < SCHEDULE_DAYS_AHEAD; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const times = calculator.getTimes(
      day.getFullYear(),
      day.getMonth() + 1,
      day.getDate(),
      lat,
      lng,
    );
    for (const key of PRAYER_ORDER) {
      if (!enabled[key]) continue;
      const at = times[key];
      if (at <= nowMs) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${PRAYER_TITLES[key].en} — ${PRAYER_TITLES[key].ar}`,
          body: 'Time for prayer',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(at),
          channelId: CHANNEL_ID,
        },
      }).catch(() => {});
      scheduled += 1;
    }
  }
  return scheduled;
}