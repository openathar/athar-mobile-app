# athar-mobile-app

> **Status: scaffold.** README and contributor notes only — no code, and
> the Flutter-vs-Kotlin-Multiplatform decision hasn't been made yet. See
> [the architecture doc](https://github.com/openathar/athar/blob/main/docs/architecture.md).

A free, ad-free, offline-first mobile app for prayer times, Qibla, Quran,
Adhkar, and Khatma tracking. Part of the Athar platform (Sadaqah Jariyah) —
see [openathar](https://github.com/openathar).

## Design intent

Offline-first, for real: `athan-core-java` gets embedded directly in the
app, so prayer times work with no network call in normal operation. The
only thing that ever syncs is optional — Khatma progress and Tasbeeh count —
and it works with no mandatory account (device ID + optional pairing code).

Adhan timing is never left to push notifications (both Android Doze mode
and iOS background throttling make that unreliable for second-accurate
triggers) — see the superproject's `docs/architecture.md`,
"Mobile constraints" section, for the actual scheduling approach
(`WorkManager` + exact alarms on Android, local
`UNUserNotificationCenter` + background refresh on iOS).

This app is deliberately last in the build order: it only makes sense once
`athan-core-java` is embeddable as a library, so the calculation logic
doesn't get written a third time.
