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
- **Qibla**: minimalist dial, arc = remaining turn, true-north heading fix,
  distance to the Kaaba; Kaaba sprite (`scripts/render-kaaba.mjs`).
- Dev preview on web: `?at=HH:MM` pins the clock (`src/lib/clock.ts`).

## Open — in this order

1. **Kaaba: smooth real 3D instead of sprites.** 40 crossfaded frames look
   choppy (double image on a hard-edged box); more frames exceed the safe
   texture size. Replace with native 3D: 4 wall Views + roof, each with its
   face texture as an `Image`, positioned via a 4×4 `matrix` transform
   (RN has no `translateZ`) + `perspective`, `backfaceVisibility: 'hidden'`,
   rotation driven by a Reanimated shared value (60 fps, UI thread). Per-face
   shading: a black overlay whose opacity follows the face normal · light.
   Face textures: export flat, unlit PNGs from the existing `wall()`/`roof()`
   functions in `scripts/render-kaaba.mjs` (door on one wall, Black Stone
   corner). Keep: no imitated calligraphy on the belt.
2. **Compass ground/background**: the Kaaba stands on the white marble
   *Mataf* (ellipse under it) with faint concentric rings; a few small dots
   circling **counter-clockwise** (the direction of tawaf). Give the day sky
   more depth (horizon haze, subtle vignette) — the flat blue gradient was
   called "not nice".
3. **Home screen — like the website**, two new sections below today's times:
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
