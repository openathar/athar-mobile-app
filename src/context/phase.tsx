import type { PrayerTimesResult } from '@openathar/athan-core-ts';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DayPalette, NightPalette, type DayPhase, type PhasePalette } from '@/constants/theme';
import { mixHex } from '@/lib/color';
import { useLocationContext } from '@/context/location';
import { useNow } from '@/hooks/use-now';
import { getDayPhase, getTodayTimes } from '@/hooks/use-prayer';
import { luminance, skyColor, starOpacity, sunAltitudeDeg } from '@/lib/sky';

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

    // One flat page colour that follows the sun (see lib/sky.ts); light or dark
    // ink is chosen from its luminance, so text never sits on a mid-tone it
    // cannot read.
    const evening = t > times.dhuhr;
    const bg = skyColor(altitude, evening);
    const dayInk = luminance(bg) > 0.3;
    const base = dayInk ? DayPalette : NightPalette;
    const colors: PhasePalette = {
      ...base,
      background: bg,
      surface: mixHex(bg, base.text, 0.05),
      rule: mixHex(bg, base.text, 0.16),
    };
    const d = dayInk ? 1 : 0;

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
