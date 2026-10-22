import Svg, { Circle, Path } from 'react-native-svg';

/** Region of a disc of radius R lit at `illumination`, lit limb on the right if `rightSide`. */
function lit(R: number, illumination: number, rightSide: boolean): string {
  const rx = Math.max(0.001, R * Math.abs(1 - 2 * illumination));
  const outerSweep = rightSide ? 1 : 0;
  const termSweep = rightSide === illumination < 0.5 ? 0 : 1;
  return `M 0 ${-R} A ${R} ${R} 0 0 ${outerSweep} 0 ${R} A ${rx} ${R} 0 0 ${termSweep} 0 ${-R} Z`;
}

/** A small flat moon disc for a point in the lunation (0 new … 0.5 full … 1 new). */
export function PhaseDisc({ fraction, size, light, dark, ring }: { fraction: number; size: number; light: string; dark: string; ring: string }) {
  const k = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  const waxing = fraction < 0.5;
  const R = 50;
  return (
    <Svg width={size} height={size} viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`}>
      <Circle r={R} fill={dark} />
      <Path d={lit(R, k, waxing)} fill={light} />
      <Circle r={R} fill="none" stroke={ring} strokeWidth={1.5} />
    </Svg>
  );
}
