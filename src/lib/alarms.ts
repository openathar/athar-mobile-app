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
 * Replace all scheduled alarms with the enabled prayers' daily triggers.
 * Web is a no-op (notifications are native-only).
 */
export function schedulePrayerAlarms(times: Record<PrayerKey, number>, enabled: AlarmSettings) {
  if (Platform.OS === 'web') return;
  Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  for (const key of PRAYER_ORDER) {
    if (!enabled[key]) continue;
    const d = new Date(times[key]);
    Notifications.scheduleNotificationAsync({
      content: {
        title: `${PRAYER_TITLES[key].en} — ${PRAYER_TITLES[key].ar}`,
        body: 'Time for prayer',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: CHANNEL_ID,
        hour: d.getHours(),
        minute: d.getMinutes(),
      },
    }).catch(() => {});
  }
}