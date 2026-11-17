import { I18nManager } from 'react-native';

/**
 * Pin an absolutely positioned element to the PHYSICAL left edge.
 *
 * In a right-to-left layout React Native swaps `left` and `right`, so `{ left: 0 }` anchors at the
 * right edge. That is what we want for text, but not for sprite sheets, meteors and orbits, which are
 * positioned with `translateX` from the left edge: anchored at the right they slid out of view (the
 * Earth on the Qibla tab vanished in Arabic). Picking the property by the native direction gives the
 * physical left edge in both.
 */
export const physicalLeft = I18nManager.isRTL ? ({ right: 0 } as const) : ({ left: 0 } as const);
