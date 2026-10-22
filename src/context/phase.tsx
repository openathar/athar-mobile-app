import type { PrayerTimesResult } from '@openathar/athan-core-ts';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DayPalette, NightPalette, type DayPhase, type PhasePalette } from '@/constants/theme';
import { mixHex } from '@/lib/color';
import { useLocationContext } from '@/context/location';
import { useNow } from '@/hooks/use-now';
import { getDayPhase, getTodayTimes } from '@/hooks/use-prayer';
import { daylight, starOpacity, sunAltitudeDeg } from '@/lib/sky';

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
  /** 0 night … 1 day, from the sun's altitude — moves the flat background between the two palettes. */
  daylight: number;
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

    // Flat palette: the background moves with the sun (night -> day over the
    // twilight band); text and accent flip at the midpoint so they never sit
    // between the two themes.
    const d = daylight(altitude);
    const base = d >= 0.5 ? DayPalette : NightPalette;
    const colors: PhasePalette = {
      ...base,
      background: mixHex(NightPalette.background, DayPalette.background, d),
      surface: mixHex(NightPalette.surface, DayPalette.surface, d),
      rule: mixHex(NightPalette.rule, DayPalette.rule, d),
    };

    return {
      phase,
      colors,
      times,
      isDay,
      sunAltitude: altitude,
      sunHeight: Math.min(1, Math.max(0, altitude / 45)),
      daylight: d,
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
