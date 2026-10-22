import { moonPhaseAt } from '@openathar/athan-core-ts';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { BigMoon } from '@/components/celestial';
import { Earth } from '@/components/earth';
import { usePhase } from '@/context/phase';
import { centralMeridian, declinationDeg } from '@/lib/globe';

/** Tilt of the moon's orbit plane against the view — the same slanted look as the website's scene. */
const TILT = (30 * Math.PI) / 180;
/** One orbit in four minutes, like the website: strongly sped up, the real direction. */
const ORBIT_SECONDS = 240;

/**
 * The website's Earth-and-Moon scene: the Earth with its day/night line, and
 * the Moon circling it on a slanted orbit, lit by the same sun (on the right).
 * It starts at today's real elongation — so the shape you see is tonight's
 * real phase — and then drifts around in four minutes, passing through every
 * phase, in front of the Earth and behind it.
 */
export function EarthMoon({ width }: { width: number }) {
  const { now } = usePhase();
  const [offset, setOffset] = useState(0);
  const earth = Math.round(width * 0.46);
  const moon = Math.round(earth / 3.67 * 1.15);
  const orbit = width * 0.4;
  const height = Math.round(earth + orbit * Math.sin(TILT) * 2 + moon);
  const [t, setT] = useState(0);

  const start = useMemo(() => moonPhaseAt(now).phaseAngle, [now.toDateString()]);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setT((Date.now() - t0) / 1000), 90);
    return () => clearInterval(id);
  }, []);

  const psi = start + (t / ORBIT_SECONDS) * 360; // degrees along the orbit (0 = new, 180 = full)
  const rad = (psi * Math.PI) / 180;
  const x = Math.cos(rad) * orbit;
  const z = Math.sin(rad); // > 0: in front of the Earth
  const y = z * orbit * Math.sin(TILT);
  const fraction = ((psi % 360) + 360) % 360 / 360;

  const cx = width / 2;
  const cy = height / 2;
  const moonEl = (
    <View style={{ position: 'absolute', left: cx + x - moon / 2, top: cy + y - moon / 2, width: moon, height: moon, alignItems: 'center', justifyContent: 'center' }}>
      <BigMoon size={moon / 0.6} fraction={fraction} />
    </View>
  );

  return (
    <View style={{ width, height }}>
      {z < 0 && moonEl}
      <View style={{ position: 'absolute', left: cx - earth / 2, top: cy - earth / 2 }}>
        <Earth size={earth} centralLon={centralMeridian(now) + offset} decl={declinationDeg(now)} onSpin={(d) => setOffset((o) => o + d)} />
      </View>
      {z >= 0 && moonEl}
    </View>
  );
}

