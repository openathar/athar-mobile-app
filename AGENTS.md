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
- Framework decision: **React Native / Expo** (SDK 57, expo-router native
  tabs). The shared calculation logic lives in `@openathar/athan-core-ts`
  (wired as `file:../core-ts`), which is also used by `athar-web`.
- `@openathar/athan-core-ts` is a **file dependency** (`file:../core-ts`),
  not a git/npm dependency. Reason: npm 11.19's allow-scripts feature
  breaks git-dep preparation and npx-spawned installs (EALLOWSCRIPTS).
  Keep it that way until npm is fixed or the package is published.

## Current state

MVP with the openathar.org design language (web palette Layl/Mushaf,
Newsreader/Plus Jakarta Sans/JetBrains Mono/Amiri, Khatam signet):

- **Prayer screen**: day-phase hero (6 phases alternate between the dark
  Layl and light Mushaf palettes, crossfade on change), Hijri date in Amiri,
  countdown to the next prayer, today's times.
- **Moon & stars** (from the openathar.org design language): the real moon
  phase as an SVG (`Moon` — terminator computed, not painted, breathing
  glow, slowly drifting maria) plus the hero twinkling star field
  (`StarField`, 25% gold / 12% green / rest ink, static under reduced
  motion). Phase math lives in the shared `@openathar/athan-core-ts`
  (`moonPhaseAt`, `nextMoonEvents`), mirroring the web's `lib/moon-phase.ts`.
- **Qibla**: compass with bearing needle + rotating Khatam center; the
  needle tracks the device heading (magnetometer via `expo-location`
  `watchHeadingAsync`) on native, static bearing on web.
- **Settings**: per-prayer Adhan alarm toggles (`expo-notifications` daily
  triggers, persisted via AsyncStorage, never push), location picker
  (Nominatim city search, stored in a shared `LocationProvider`).
- Location: manual city > auto-detect > Berlin fallback.
- Tabs: Prayer / Qibla / Settings (native tabs bottom; web tab bar bottom).

Next milestones: native builds to verify location + notifications on device,
Adhan audio, store submission.

## CI

`.github/workflows/ci.yml` — three jobs on push/PR: typecheck (incl. build
+ tests of the embedded `athan-core-ts`), Android emulator smoke (API 34
with KVM: assembleDebug, boot, install, launch, liveness assert, screenshot),
iOS simulator smoke (macos-15: pod install, xcodebuild Debug-iphonesimulator,
simctl install/launch, liveness assert, screenshot). Screenshots land as
workflow artifacts.

`expo-modules-jsi` is pinned to 57.1.1 (npm overrides) and carries a
`patches/expo-modules-jsi+57.1.1.patch`: strips `SWIFT_RETURNS_RETAINED`
from the `RuntimeScheduler` constructors and boxes raw-pointer captures in
`JavaScriptRuntime` host closures — both hard-error under Xcode 26.2+
(`weak let` needs 26.2+, but its stricter sending-region analysis rejects
the upstream `nonisolated(unsafe)` pattern; Xcode 26.1 predates `weak let`).
Applied automatically via `postinstall: patch-package`. Re-evaluate the
patch when Expo ships an SDK 57.x release targeting Xcode 26.2+.

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