import { useWindowDimensions } from 'react-native';

/**
 * The layout width, never zero. Web's first layout pass reports width 0, and
 * several visuals derive a size from it — a negative size is an invalid SVG
 * attribute and floods the console in dev. 320 is the narrowest phone we
 * support, so the first pass is simply already plausible.
 */
export function useScreenWidth(): number {
  const { width } = useWindowDimensions();
  return Math.max(width, 320);
}
