# Celestial sprites

Pre-rendered frames of the moon for `src/components/celestial.tsx`. A lit
textured sphere live would need a GL context (expo-gl + three.js, a native
rebuild); instead the phases are rendered offline and the app crossfades two
neighbouring frames on the UI thread.

| File | Content |
| --- | --- |
| `moon-phases.jpg` | 30 frames (6×5 grid, 340 px, 2040×1700): the moon's near side at lunation fraction k/30 — frame 0 new moon, 15 full moon, waxing lit on the right. Lit exactly like the website's hero moon: warm directional light (#fff6e8, 2.3), blue earthshine (#7f93b4 × texture × 0.14) so the night side is never black, ambient 0.04, ACES tone mapping. |

Grids stay ≤ 2048 px per side (some Android GPUs cannot upload larger
textures). Pixels outside the disc are black; the app clips to a circle.

Regenerate with `node scripts/render-moon-phases.mjs` (see the script header
for the one-time BMP conversion of the texture).

The sun used to be here too (`sun-rotation.jpg`) and was removed on purpose:
the website shows only the moon, and so does the app.

## Source & license

Rendered from the Solar System Scope texture `2k_moon.jpg`
(https://www.solarsystemscope.com/textures/), based on NASA data, licensed
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is the
same file the website uses (`web/public/textures/`).
