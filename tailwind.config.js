/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        obsidian: '#0a0d14',
        sapphire: '#0d1530',
        lapis: '#152457',
        cobalt: '#1f3278',
        pearl: '#eceff4',
        porcelain: '#f6f6f3',
        jade: '#e8eee9',
        silver: '#e1e7ec',
        garnet: '#47182a',
        emerald: '#0f3a32',
        amethyst: '#22193f',
        gold: '#d4a95f',
        'gold-deep': '#9a6f1f',
        ink: '#e9e3d4',
        'ink-day': '#23261f',
        mute: '#98a0b0',
        'mute-day': '#5c6156',
      },
      fontFamily: {
        display: ['PlusJakartaSans_300Light'],
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
        arabic: ['Amiri_400Regular'],
        'arabic-bold': ['Amiri_700Bold'],
      },
    },
  },
  plugins: [],
};
