# athar-mobile-app

> **Status: MVP in progress.** React Native / Expo (SDK 57) app with a
> prayer times screen (day-phase hero, real moon phase, star field), Qibla
> bearing, adhan alarms, and location picker. See the
> [architecture doc](https://github.com/openathar/athar/blob/main/docs/architecture.md).

A free, ad-free, offline-first mobile app for prayer times, Qibla, Quran,
Adhkar, and Khatma tracking. Part of the Athar platform (Sadaqah Jariyah) —
see [openathar](https://github.com/openathar).

## Design intent

Offline-first, for real: prayer times are computed locally via
`@openathar/athan-core-ts` (the TypeScript port of `athan-core-java`, shared
with `athar-web`), so no network call is needed in normal operation. The
only thing that ever syncs is optional — Khatma progress and Tasbeeh count —
and it works with no mandatory account (device ID + optional pairing code).

Adhan timing is never left to push notifications (both Android Doze mode
and iOS background throttling make that unreliable for second-accurate
triggers) — see the superproject's `docs/architecture.md`,
"Mobile constraints" section, for the actual scheduling approach
(`WorkManager` + exact alarms on Android, local
`UNUserNotificationCenter` + background refresh on iOS).

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit
npm start           # expo start
```

`@openathar/athan-core-ts` is wired as a file dependency (`file:../core-ts`)
because npm 11.19's allow-scripts feature breaks git-dependency preparation
and npx-spawned installs (`EALLOWSCRIPTS`). Run `expo` via
`./node_modules/.bin/expo` rather than `npx expo` for the same reason.