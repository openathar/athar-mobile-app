import type { PrayerTimesResult } from '@openathar/athan-core-ts';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { PhaseColors, type DayPhase, type PhasePalette } from '@/constants/theme';
import { useLocationContext } from '@/context/location';
import { useNow } from '@/hooks/use-now';
import { getDayPhase, getTodayTimes } from '@/hooks/use-prayer';
import { DARK_SKY_BELOW_DEG, skyGradient, starOpacity, sunAltitudeDeg } from '@/lib/sky';

export type PhaseState = {
  phase: DayPhase;
  /** Text/accent/surface palette, chosen by how bright the sky actually is. */
  colors: PhasePalette;
  times: PrayerTimesResult;
  /** Sun above the horizon (between sunrise and maghrib). */
  isDay: boolean;
  /** Sun altitude in degrees (negative below the horizon). */
  sunAltitude: number;
  /** 0 at the horizon … 1 high in the sky — drives the sun's tint and light. */
  sunHeight: number;
  /** [zenith, horizon] — the real sky for this moment and place. */
  sky: [string, string];
  starOpacity: number;
  /** Rounded to 20s — the resolution every consumer of the phase needs. */
  now: Date;
};

const PhaseContext = createContext<PhaseState | null>(null);

/**
 * The day as app-wide state: one sky, one palette for every screen and the
 * tab bar (they used to follow the OS light/dark setting while the prayer
 * screen followed the day). The background is the actual sky for the sun's
 * altitude here and now — not a fixed colour per prayer phase.
 */
export function PhaseProvider({ children }: { children: ReactNode }) {
  const now = useNow(20_000);
  const { location } = useLocationContext();
  const dayKey = now.toDateString();

  const times = useMemo(
    () => getTodayTimes(now, location.lat, location.lng),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, location.lat, location.lng]
  );

  const value = useMemo<PhaseState>(() => {
    const t = now.getTime();
    const phase = getDayPhase(now, times);
    const isDay = t >= times.sunrise && t < times.maghrib;
    const altitude = sunAltitudeDeg(now, location.lat, times.dhuhr);
    const evening = t > times.dhuhr;

    // Text colours follow the sky's brightness: just after sunrise the sky is
    // still dark, and in late Asr it is already dimming — the phase alone
    // would put dark text on a dark sky there.
    let colors = PhaseColors[phase];
    if (altitude < DARK_SKY_BELOW_DEG && (phase === 'sunrise' || phase === 'dhuhr' || phase === 'asr')) {
      colors = PhaseColors[evening ? 'maghrib' : 'fajr'];
    }

    return {
      phase,
      colors,
      times,
      isDay,
      sunAltitude: altitude,
      sunHeight: Math.min(1, Math.max(0, altitude / 45)),
      sky: skyGradient(altitude, evening),
      starOpacity: starOpacity(altitude),
      now,
    };
  }, [now, times, location.lat]);

  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>;
}

export function usePhase(): PhaseState {
  const value = useContext(PhaseContext);
  if (!value) throw new Error('usePhase must be used within PhaseProvider');
  return value;
}
