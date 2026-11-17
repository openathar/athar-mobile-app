# AGENTS.md — athar-mobile-app

Mobile app (iOS/Android) of the Athar platform (openathar). Offline-first:
computes prayer times locally via `@openathar/athan-core-ts` (the TypeScript
port of `athan-core-java`), no server call needed in normal operation.
Optional sync only for Khatma progress/Tasbeeh (no mandatory account).

## Links

- Architecture/roadmap: `../../AGENTS.md` (superproject `business/athar`)
- Repo conventions: `~/Development/harness/agents/business-repo.md`

## Critical points

- NEVER rely on push for Adhan timing (Doze/iOS background are unreliable)
  — use local alarms/notifications (see the superproject AGENTS.md,
  "Mobile constraints" section).
- Framework decision: **React Native / Expo** (SDK 58, expo-router native
  tabs). The shared calculation logic lives in `@openathar/athan-core-ts`
  (published to npm, pinned `0.1.0`), which is also used by `athar-web`.
- `@openathar/athan-core-ts` comes from **npm** (`0.1.0`, exact-pinned), no
  longer a `file:` dependency. ADR-001 (one calculation source) is enforced
  by consuming the published package; it is built + tested in its own repo
  and published on tag (`v*`).

## Design and plan

Design contract: `docs/design.md` (same language as openathar.org: flat night/day
palette, one gold accent, Plus Jakarta Sans light, hairline lists, no
gradients/glass/glow/boxes). Work order: `docs/plan.md`. Screens use only
`usePhase().colors` and the components in `src/components/screen.tsx`.

## Current state

MVP with the openathar.org design language (web palette Layl/Mushaf,
Plus Jakarta Sans/JetBrains Mono/Amiri), five tabs: Today, Qibla, Sky,
Feelings, Settings. The full list of what exists and what is open:
`docs/redesign-status.md`; work order: `docs/plan.md`; the design contract:
`docs/design.md`.

- **Today**: the website's Earth (day/night line, city lights, drag to turn),
  Hijri date, countdown to the next prayer, today's times, then "Anywhere"
  (any city's day, computed on the device) and "Two books" (verse + observed
  sign, bundled, offline).
- **Qibla**: compass ring around the Earth turned so you and the Kaaba both
  face you; the needle tracks the magnetometer on native, static on web.
- **Sky**: tonight's real moon, age, next new/full moon, the eight faces, the
  Hijri month grid, upcoming observances.
- **Feelings**: the website's tree (chest branches, belly roots), tappable.
- **Settings**: per-prayer adhan alarms (five prayers, never sunrise; one-shot
  DATE triggers computed 7 days ahead, rescheduled on settings/location change
  + foreground, persisted via AsyncStorage, never push), location picker,
  calculation method, information rows. Android declares
  `SCHEDULE_EXACT_ALARM` for exact delivery.
- **Calculation method** (`src/context/settings.tsx`): one convention for the
  whole app (times, countdown, Anywhere, alarms), default guessed from the
  device time zone.
- **City lookup** (`src/lib/places.ts`): bundled cities first, then our own
  `api.openathar.org/v1/places` — never a third-party geocoder. Web preview
  logs a CORS error because the API's allow-list has no Expo dev port; native
  is unaffected.
- **Languages**: EN, DE, AR (RTL), PL, TR; picker in Settings, default =
  phone language. Strings in `src/lib/i18n.ts`; PL/TR content falls back to
  English (`CONTENT_LOCALE`).
- Location: manual city > auto-detect > Berlin fallback.

Next milestones: native builds to verify location + notifications on device,
Adhan audio, store submission.

## CI

`.github/workflows/ci.yml` — three jobs on push/PR: typecheck, Android
emulator smoke (API 34
with KVM: assembleDebug, boot, install, launch, liveness assert, screenshot),
iOS simulator smoke (macos-15: pod install, xcodebuild Debug-iphonesimulator,
simctl install/launch, liveness assert, screenshot). Screenshots land as
workflow artifacts.

SDK 58 (RN 0.88): upstream fixed most Xcode 26 / Swift 6.2 errors in
`expo-modules-jsi`, one `sending` capture is left — pinned to 58.0.21 and
patched (`patches/README.md`, applied on `postinstall`).

`@openathar/athan-core-ts` is installed from npm — no `CORE_TS_TOKEN` or
cross-repo checkout needed anymore (it used to be a `file:` dependency).

## APM (Agent Package Manager)

Project-local skills/agents/commands are managed via `apm.yaml`
(registry source: `~/Development/harness/registry/`).
- `apm install --local` — installs the packages listed in `apm.yaml`
- `apm status --local` — checks install state against the registry

## Lessons (verified in the iOS simulator, 2026-11-17)

- **No NativeWind / Tailwind.** It was added on 2026-11-02 with zero `className` uses. Its JSX transform
  wrapped every component and silently dropped the style of every `Pressable` with a function style
  (`style={({ pressed }) => …}`): the alarm switches collapsed to 20×20 px and were invisible on iOS,
  while the web preview looked fine. Removed. Do not bring it back without fixing that.
- **Check on the simulator, not only on web.** Three real bugs only showed up there: a Hijri date of
  "NaN" (Hermes returns Arabic-Indic digits), the invisible switches (above), and an endless reload at
  start-up in Arabic.
- **Right-to-left:** React Native swaps `left`/`right` in RTL. Meteors and the moon orbit
  are positioned from the physical left edge, so use `physicalLeft` (`src/lib/rtl.ts`), never `left: 0`.
  Direction changes reload the app at most once (`syncDirection`); `<DirectionRoot>` lays the screens
  out RTL itself when the native side does not take the forced direction (Expo Go).
- **Design (2026-11-17):** default theme is the website's night (`obsidian`, `#0b0f17`); background is
  meteors only; the moon is the only sky body (no sun); the Qibla globe has no clouds.
- **Skia (`@shopify/react-native-skia`, pinned to the version Expo Go bundles) draws the sky:** planets as
  shaders, meteors as gradient strokes. Pinned exact, no install scripts. Worklet gotcha: inside
  `useDerivedValue` only plain numbers and worklets exist; read `image.width()` and call helpers
  *outside* and capture the numbers, or the UI thread throws and the app aborts (a `SIGABRT` with a
  Hermes `throwPendingError` frame in the crash report).
