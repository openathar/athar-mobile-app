# Mobile app — plan

State on 2026-10-22. The calculation, notifications and Qibla MVP exist
(Expo SDK 57, offline-first, `@openathar/athan-core-ts`); the design now
follows the landing page (see `design.md`). This plan is the order of work
to a store release. Constraints are in `AGENTS.md` and `redesign-status.md`.

## Phase 1 — Design alignment (done in this change)

- [x] Flat palette from the website (night/day), one gold accent, no gradient,
      glow, glass or boxes; background follows the real sun
- [x] Plus Jakarta Sans light display; Newsreader dropped
- [x] Home, Qibla and Settings restyled through the shared components;
      flat tab strip (web) / matching native tabs
- [ ] Check the location modal (`src/app/location.tsx`) — still a tinted box
- [ ] Verify on a real device and in the light (day) theme on every screen

## Phase 2 — Language and the missing home sections (1–3 done, 4 open)

1. **[done] DE / EN / AR in the app** (it is English-only today, the site is
   trilingual): strings in one dictionary, system language default, RTL
   layout (logical styles only), Arabic digits for Hijri already done.
   Strings: `src/lib/i18n.ts` (handwritten, Arabic needs a native proofread).
   Still English: the labels on the armillary sphere (`falak.tsx`).
2. **[done] Anywhere**: pick a city, see its prayer times, computed locally. Search
   via our own `GET https://api.openathar.org/v1/places` (returns coordinates
   and the UTC offset for a date) instead of Nominatim — no third party sees
   the query; the last five cities are kept for offline use (`components/anywhere.tsx`).
   Web preview note: the API's CORS list does not include the Expo dev port;
   native calls are unaffected.
3. **[done] Two books**: a verse and an observation from the bundled
   `web/data/reflections.json` (copied to `src/data/`; keep in sync when the
   website's file changes; offline, deterministic per day, "another sign");
   provenance line always shown, Arabic review note while `arabicApproved` is false.
4. **Sky tab** (or section): moon phase, age, next new/full moon (already in
   `athan-core-ts`), "eight faces of one moon", upcoming Islamic dates
   (port the observance list from the API's `EventsService`, same neutral
   wording for Mawlid and Laylat al-Qadr).

## Phase 3 — Reliable on a device (blocks release)

- Real-device test matrix (Android 12–15 incl. Doze and exact-alarm
  permission; iOS 17+): location permission flows, notifications scheduled 7
  days ahead, rescheduling on timezone/DST change and after reboot
- Battery-optimisation guidance screen (Android), notification permission
  explainer before the system prompt
- Qibla compass on hardware (magnetometer calibration hint)

## Phase 4 — Adhan audio

- A **licence-clean** recording (needs a decision: commission, public-domain
  source, or none at launch — notification default sound only)
- iOS: custom notification sounds are limited to 30 s; Android: one channel
  per sound; per-prayer choice later
- Never push for timing (project rule)

## Phase 5 — Store release

- EAS Build profiles, signing, bundle id `org.openathar.mobile` (already set in `app.json`; confirm)
- Icon and splash from the Athar mark; store screenshots (generated from the
  real UI, DE/EN/AR)
- Privacy labels: no data collected, no tracking, no accounts
- Listings in three languages; TestFlight and Play internal testing first
- CI already smoke-tests Android and iOS builds

## Phase 6 — After launch

- Khatma and Tasbeeh — local first; sync only after the account-free
  device-ID/pairing design is decided (`../docs/architecture.md`). This is
  where the tree returns: growth as progress
- Home-screen widget and Live Activity (next prayer)
- Qur'an/Adhkar reading — blocked on a licence-clean text source (same as the
  API's last roadmap item)

## Decisions needed from you

1. Adhan audio: which source, or launch without?
2. Bundle id / store account owner (individual vs. association)
3. Languages at launch: all three or EN + AR first?
4. Keep the armillary sphere as the home hero (current design) or the moon?
