# Celestial sprites

Pre-rendered frames of textured spheres for the sun/moon in the screen
header (`src/components/celestial.tsx`). Rendering a textured sphere live
would need a GL context (expo-gl + three.js, a native rebuild); instead the
sphere is projected offline and the app crossfades between neighbouring
frames, which reads as continuous motion.

| File | Content |
| --- | --- |
| `moon-libration.jpg` | 32 frames (8×4 grid, 224 px): the moon's near side along a closed libration path, ±14° longitude / ±6° latitude. Unlit — the phase is applied live. |
| `sun-rotation.jpg` | 60 frames (10×6 grid, 200 px): one rotation about the sun's 7.25° tilted axis, limb darkening baked in. |

Grids stay ≤ 2048 px per side (some Android GPUs cannot upload larger
textures). Pixels outside the disc are black; the app clips to a circle.

Regenerate with `node scripts/render-celestial.mjs` (see the script header;
it expects the source textures converted to BMP next to it).

## Source & license

Rendered from Solar System Scope textures (`2k_moon.jpg`, `2k_sun.jpg`,
https://www.solarsystemscope.com/textures/), based on NASA data, licensed
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The moon
texture is the same file the website uses (`web/public/textures/`).
