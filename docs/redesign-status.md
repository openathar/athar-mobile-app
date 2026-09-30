# Redesign status & next steps

Living hand-off for the app-wide redesign (Sept/Oct 2026). Read this before
continuing the redesign work.

## Done

- **One design system** (`src/components/screen.tsx`): every screen renders
  inside `<Screen>` (sky, sunlight, stars, scroll container) with
  `<ScreenHeader>`, `<Card>`, `<Divider>`, `<SectionLabel>` (`// label`, the
  website's voice). Fixes "can't scroll" on Settings/Qibla structurally.
- **One palette source** (`src/context/phase.tsx`, `PhaseProvider` at the
  root): screens and both tab bars follow the day instead of the OS
  light/dark setting.
- **Real sky** (`src/lib/sky.ts`): background computed from the sun's
  altitude (declination + hour angle from Dhuhr), continuous through night →
  twilight → blue hour → dawn/dusk → day; dawn and dusk differ. Text colours
  follow sky brightness (`DARK_SKY_BELOW_DEG`), stars fade with daylight.
- **Sun/moon** (`src/components/celestial.tsx`): textured spheres from the
  website's Solar System Scope/NASA textures (CC BY 4.0), pre-rendered to
  sprite sheets (`scripts/render-celestial.mjs`, `assets/images/celestial/`).
  Moon: real phase with soft terminator, libration instead of spin, no glow.
  Sun: regraded to a temperature ramp (white-hot centre → orange limb), slow
  rotation, tight bloom, redder when low.
- **Armillary sphere** on the prayer screen (`src/components/falak.tsx`),
  UI-thread 3D via Reanimated worklets.
- **Kaaba**: a native 3D box (`src/components/kaaba3d.tsx`), not a sprite —
  4 wall `View`s + a roof, each wearing a flat unlit face texture
  (`scripts/render-kaaba-faces.mjs`), placed with a 4×4 matrix (RN has no
  `translateZ`) and spun by a Reanimated shared value on the UI thread.
  Per-face shading is a black overlay whose opacity follows face-normal ·
  light, recomputed every frame since the light is fixed in the world while
  the box turns. Gotcha: react-native-web maps the `matrix` transform key
  to the 2D 6-argument CSS `matrix()` regardless of array length, silently
  dropping a 16-element 4×4 as invalid — use `matrix3d` on web instead (see
  `MATRIX_KEY` in the component). It stands on the **Mataf**: a
  foreshortened marble ellipse (`Mataf` in `qibla.tsx`) with a faint ring
  and small gold dots orbiting counter-clockwise (tawaf).
- **Sky depth**: `Screen` blends a third, warm haze stop near the horizon
  (not just a flat zenith→horizon gradient) and a soft SVG radial vignette
  over the whole frame.
- **Qibla**: minimalist dial, arc = remaining turn, true-north heading fix,
  distance to the Kaaba.
- Dev preview on web: `?at=HH:MM` pins the clock (`src/lib/clock.ts`).

## Open — in this order

1. **Home screen — like the website**, two new sections below today's times:
   - *Anywhere*: pick any city (search, reuse the Nominatim logic from
     `src/app/location.tsx`) or position and see its prayer times, computed
     locally with `@openathar/athan-core-ts`. Check `web/lib/cities.ts` and
     `web/lib/timezones.ts` for the city list and timezone handling (the
     place's UTC offset is needed for wall-clock times).
   - *Two books* (revelation & creation): a verse + a scientific observation
     from `web/data/reflections.json`, offline (use the entries' fallback
     texts), deterministic per day, "another sign" button. Carry the
     provenance line (AI-drafted, editorially reviewed) and respect
     `provenance.arabicApproved`.

## Constraints learned the hard way

- No new npm dependencies (npm allow-scripts → `EALLOWSCRIPTS`; `expo lint`
  fails the same way). Gate: `npm run typecheck`.
- Verify on web: `./node_modules/.bin/expo start --web --port 8083`, then a
  390×844 viewport; test scrolling with real wheel events, not only
  screenshots.
- `react-native-svg` on web: don't use `rotation`/`origin` on SVG elements
  (invalid `transform-origin` DOM prop, dev error toast) — use
  `transform="rotate(deg x y)"`.
- Sprite sheets ≤ 2048 px per side (older Android GPUs).
