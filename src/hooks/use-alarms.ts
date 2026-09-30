import { useAlarmsContext } from '@/context/alarms';

/** Convenience hook — reads the shared alarm state (see AlarmsProvider). */
export function useAlarms() {
  return useAlarmsContext();
}

export type { AlarmPermission } from '@/context/alarms';
