/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * Palette der Website openathar.org: dunkles "Layl"-Theme als Basis,
 * helles "Mushaf"-Theme. Grün ist der Akzent, Gold ist dem أثر-Wortzeichen
 * vorbehalten. Siehe web/app/globals.css.
 */
export const Colors = {
  light: {
    text: '#23261f',
    background: '#faf5ea',
    backgroundElement: '#f2ecdd',
    backgroundSelected: '#eae3d0',
    textSecondary: '#5c6156',
    accent: '#0d7a55',
    gold: '#9a6f1f',
    rule: '#d8d0bb',
  },
  dark: {
    text: '#e9e3d4',
    background: '#0b0f17',
    backgroundElement: '#121a26',
    backgroundSelected: '#1a2433',
    textSecondary: '#939bab',
    accent: '#4aa583',
    gold: '#d4a95f',
    rule: '#222b3a',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Drei Stimmen wie auf der Website: serif (Newsreader), sans (Plus Jakarta
 *  Sans), mono (JetBrains Mono) — Arabisch in Amiri. */
export const Fonts = {
  display: 'Newsreader_500Medium',
  serif: 'Newsreader_400Regular',
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 64 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Day-phase design: the app's palette follows the religious day
 * (Fajr → Sunrise → Dhuhr → Asr → Maghrib → Isha). The phases alternate
 * between the website's two themes — Layl (dark) at night, Mushaf (light)
 * by day — with gold/green accents from the web palette.
 */
export type DayPhase = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PhasePalette = {
  background: string;
  surface: string;
  accent: string;
  text: string;
  textSecondary: string;
  /** Two-stop gradient for the screen background. */
  gradient: readonly [string, string];
  /** Hairline separator color inside the phase-tinted card. */
  rule: string;
  /** Moon rendering (lit disk, dark side, glow + maria tones). */
  moon: { lit: string; dark: string; glow: string; maria: string };
  /** Star-field colors: [gold, green, ink] like the web hero. */
  stars: readonly [string, string, string];
};

export const PhaseColors: Record<DayPhase, PhasePalette> = {
  fajr: {
    background: '#0b0f17',
    surface: '#121a26',
    accent: '#d4a95f',
    text: '#e9e3d4',
    textSecondary: '#939bab',
    gradient: ['#0b0f17', '#1a2133'],
    rule: '#222b3a',
    moon: { lit: '#e9e3d4', dark: '#39445c', glow: '#d4a95f', maria: '#b8b09c' },
    stars: ['#d4a95f', '#4aa583', '#e9e3d4'],
  },
  sunrise: {
    background: '#faf5ea',
    surface: '#f2ecdd',
    accent: '#9a6f1f',
    text: '#23261f',
    textSecondary: '#5c6156',
    gradient: ['#faf5ea', '#f3e7c8'],
    rule: '#d8d0bb',
    moon: { lit: '#efe6cf', dark: '#d6cdb2', glow: '#9a6f1f', maria: '#c9bfa4' },
    stars: ['#9a6f1f', '#0d7a55', '#23261f'],
  },
  dhuhr: {
    background: '#faf5ea',
    surface: '#f2ecdd',
    accent: '#0d7a55',
    text: '#23261f',
    textSecondary: '#5c6156',
    gradient: ['#faf5ea', '#e6efe8'],
    rule: '#d8d0bb',
    moon: { lit: '#efe6cf', dark: '#d6cdb2', glow: '#9a6f1f', maria: '#c9bfa4' },
    stars: ['#9a6f1f', '#0d7a55', '#23261f'],
  },
  asr: {
    background: '#faf5ea',
    surface: '#f2ecdd',
    accent: '#8a6f3b',
    text: '#23261f',
    textSecondary: '#5c6156',
    gradient: ['#faf5ea', '#f0e4c4'],
    rule: '#d8d0bb',
    moon: { lit: '#efe6cf', dark: '#d6cdb2', glow: '#9a6f1f', maria: '#c9bfa4' },
    stars: ['#9a6f1f', '#0d7a55', '#23261f'],
  },
  maghrib: {
    background: '#0b0f17',
    surface: '#121a26',
    accent: '#d4a95f',
    text: '#e9e3d4',
    textSecondary: '#939bab',
    gradient: ['#0b0f17', '#2a1f18'],
    rule: '#222b3a',
    moon: { lit: '#e9e3d4', dark: '#39445c', glow: '#d4a95f', maria: '#b8b09c' },
    stars: ['#d4a95f', '#4aa583', '#e9e3d4'],
  },
  isha: {
    background: '#0b0f17',
    surface: '#121a26',
    accent: '#4aa583',
    text: '#e9e3d4',
    textSecondary: '#939bab',
    gradient: ['#0b0f17', '#101c2b'],
    rule: '#222b3a',
    moon: { lit: '#e9e3d4', dark: '#39445c', glow: '#4aa583', maria: '#b8b09c' },
    stars: ['#d4a95f', '#4aa583', '#e9e3d4'],
  },
};
