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

## APM (Agent Package Manager)

Projekt-lokale Skills/Agents/Commands werden über `apm.yaml` verwaltet
(Registry-Quelle: `~/Development/harness/registry/`).
- `apm install --local` — installiert die in `apm.yaml` gelisteten Packages
- `apm status --local` — prüft Installations-Stand gegen die Registry