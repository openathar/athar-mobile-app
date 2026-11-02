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
  (wired as `file:../core-ts`), which is also used by `athar-web`.
- `@openathar/athan-core-ts` is a **file dependency** (`file:../core-ts`),
  not a git/npm dependency. Reason: npm 11.19's allow-scripts feature
  breaks git-dep preparation and npx-spawned installs (EALLOWSCRIPTS).
  Keep it that way until npm is fixed or the package is published.

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

`.github/workflows/ci.yml` — three jobs on push/PR: typecheck (incl. build
+ tests of the embedded `athan-core-ts`), Android emulator smoke (API 34
with KVM: assembleDebug, boot, install, launch, liveness assert, screenshot),
iOS simulator smoke (macos-15: pod install, xcodebuild Debug-iphonesimulator,
simctl install/launch, liveness assert, screenshot). Screenshots land as
workflow artifacts.

SDK 58 (RN 0.88): upstream fixed most Xcode 26 / Swift 6.2 errors in
`expo-modules-jsi`, one `sending` capture is left — pinned to 58.0.21 and
patched (`patches/README.md`, applied on `postinstall`).

Requires the repo secret **`CORE_TS_TOKEN`**: a fine-grained PAT with
read-only Contents access on `openathar/athan-core-ts`. (Historically both
repos were private and `GITHUB_TOKEN` could not check the package repo out
cross-repo; the PAT is still used and keeps the checkout working regardless
of visibility.)

## APM (Agent Package Manager)

Project-local skills/agents/commands are managed via `apm.yaml`
(registry source: `~/Development/harness/registry/`).
- `apm install --local` — installs the packages listed in `apm.yaml`
- `apm status --local` — checks install state against the registry