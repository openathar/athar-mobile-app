# Redesign status & next steps

> **Update 2026-11-01:** the open list below is done — the home sections
> ("Anywhere", "Two books") shipped, the location modal was rebuilt on the
> shared components and no longer calls Nominatim, and the day theme was
> checked on every screen. New in this round: one calculation method for the
> whole app (Settings → Times → `src/app/method.tsx`), sunrise out of the
> adhan toggles, the app's own flat `Switch`, and a shared city lookup
> (`src/lib/places.ts`). What is left is device work and the decisions in
> `plan.md`.

Living hand-off for the app-wide redesign. Read this before continuing.

## Done

- **One design system** (`src/components/screen.tsx`): every screen renders
  inside `<Screen>` (sky, stars, scroll container) with `<ScreenHeader>`,
  `<ModalHeader>` (both modals), `<Card>`, `<Divider>`, `<SectionLabel>`.
  Fixes "can't scroll" on Settings/Qibla structurally.
- **One palette source** (`src/context/phase.tsx`, `PhaseProvider` at the
  root): screens and both tab bars follow the day instead of the OS
  light/dark setting.
- **Real sky** (`src/lib/sky.ts`): background computed from the sun's
  altitude, continuous through night → twilight → blue hour → dawn/dusk →
  day; dawn and dusk differ. Text colours follow sky brightness, stars fade
  with daylight.
- **Sun/moon** (`src/components/celestial.tsx`): textured spheres from the
  website's Solar System Scope/NASA textures (CC BY 4.0), pre-rendered to
  sprite sheets (`scripts/render-celestial.mjs`, `assets/images/celestial/`).
- **Earth** (`src/components/earth.tsx`) and **Earth + Moon**
  (`earth-moon.tsx`): the website's textured globe with the real day/night
  line, drag to turn; sprites from `scripts/render-*.mjs`.
- **Kaaba** (`src/components/kaaba3d.tsx`, in the repo history) and the
  **Mataf** marble ellipse: a native 3D box spun on the UI thread. Web
  gotcha: react-native-web maps the `matrix` transform key to the 2D CSS
  `matrix()` regardless of array length — use `matrix3d` on web.
- **Screen sizes are never negative**: `useScreenWidth()` (min 320) — web's
  first layout pass reports 0, which turned size-derived SVGs into invalid
  negative attributes in dev.
- **Switches** (`src/components/switch.tsx`): a flat palette pill; the
  platform switch brought iOS green and a shadow into a page with neither.
  `aria-checked` is set explicitly (react-native-web ignores
  `accessibilityState.checked` for a plain view).
- **Calculation method** (`src/context/settings.tsx`): six conventions,
  persisted, default guessed from the device time zone; used by the phase
  provider (all times), the alarms and "Anywhere".
- **Qibla**: minimalist dial, arc = remaining turn, true-north heading fix,
  distance to the Kaaba.
- Dev preview on web: `?at=HH:MM` pins the clock (`src/lib/clock.ts`).

## Open

1. **Real device pass** (plan.md Phase 3) — nothing in this round was run on
   hardware; the web preview cannot show permissions, sensors or scheduling.
2. **Stars behind text**: a star can land under a header subtitle, while
   `design.md` says stars live over the header and the sphere, never behind
   text. Needs a decision (a masked header band, or accept it).
3. **Arabic proofread** of the handwritten strings, including the new method
   names and the two-book provenance note.
4. **Web preview noise**: `api.openathar.org` CORS does not include the Expo
   dev port, so city searches log a fetch error in the browser and fall back
   to the bundled cities. Native is unaffected.

## Constraints learned the hard way

- No new npm dependencies (npm allow-scripts → `EALLOWSCRIPTS`; `expo lint`
  fails the same way). Gate: `npm run typecheck`.
- Verify on web: `./node_modules/.bin/expo start --web --port 8083`, then a
  390×844 viewport; test scrolling with real wheel events, not only
  screenshots. A tall viewport (390×2400) shows a whole screen in one shot.
- `react-native-svg` on web: don't use `rotation`/`origin` on SVG elements
  (invalid `transform-origin` DOM prop, dev error toast) — use
  `transform="rotate(deg x y)"`.
- Sprite sheets ≤ 2048 px per side (older Android GPUs).
