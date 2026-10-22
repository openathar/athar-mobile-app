# App design — one language with openathar.org

> **Round 2 (2026-10-22):** designed with Sleek (`docs/design-sleek/`, project
> https://sleek.design/project/5FzT8ztoIVh — four screens before the trial
> credits ran out) and built from there: five tabs (Today, Qibla, Sky,
> Feelings, Settings), the page colour follows the day in six moods, Sky and
> Feelings mirror the website, and everything works offline with no sign of it.

The app and the landing page are one product: same night, same gold, same
type, same quiet. This file is the contract. Change it here first.

## Subject and job

A prayer instrument for a person who opens it a few times a day, often in
one second, often at night. Primary job: **what is the next prayer and how
long until it** — offline, instantly. Everything else is a calm second layer.

## Tokens

| Role | Night (Layl) | Day (Mushaf) |
|---|---|---|
| Background | `#0b0f17` | `#faf5ea` |
| Ink | `#e9e3d4` | `#23261f` |
| Mute | `#98a0b0` | `#5c6156` |
| Rule (hairlines) | `#232c3b` | `#d8d0bb` |
| Accent (one) | `#d4a95f` | `#9a6f1f` |
| Green (tree/roots only) | `#4aa583` | `#0d7a55` |

- **Flat colour, no gradient, no glass, no glow, no boxes.** The background is
  one colour that moves with the real sun (`daylight()` in `lib/sky.ts`:
  night → day across the twilight band, about twenty minutes either side of
  sunrise and sunset). Text and accent flip at the midpoint.
- **One accent**, a single palette entry. Never per-phase accents.
- Stars exist only over the header and the sphere, never behind text.

## Type

Plus Jakarta Sans for everything Latin — **light (300)** for display, regular
and medium below. JetBrains Mono only for numbers that are data (times,
countdown, degrees). Amiri for Arabic, set larger than the Latin beside it.
No serif anywhere (the website dropped it; Newsreader is no longer loaded).

| Use | Size / weight |
|---|---|
| Next prayer name | 56 light, tight tracking −1.5 |
| Countdown | 34 mono medium |
| Screen title | 34 light |
| Row text | 18 medium |
| Labels, captions | 14 medium / regular, sentence case |

No all-caps labels, no `// ` prefixes, no letter-spaced eyebrows: a label is a
plain word.

## Layout

Left-aligned, like the landing hero. Lists are hairline-separated rows on the
page itself — the website's lists, not cards.

```
 ┌────────────────────────────┐
 │ ١١ جمادى الأولى ١٤٤٨   ◯ moon │  Hijri (Amiri, accent) · today's real moon/sun
 │ Thursday, October 22 · Berlin │
 │                              │
 │      ( armillary sphere )    │  the one memorable object; drag to turn
 │                              │
 │ Next prayer                  │
 │ Asr  العصر                   │  56 light + Amiri accent
 │ 01:54:55                     │  live countdown, mono
 │ at 15:25                     │
 │ ─────────────────────────────│
 │ Today                        │
 │ Fajr  الفجر           05:50  │  next = accent, passed = mute
 │ ─────────────────────────────│
 ├────────────────────────────┤
 │ Prayer    Qibla    Settings  │  flat strip, hairline on top, short mark
 └────────────────────────────┘     under the active label (no capsule)
```

The sphere is the one bold moment (the user's own preference: a real, turnable
3D object, not a flat vector). The tree stays a website motif; it comes to the
app where growth is the content (Khatma, Tasbeeh — see plan).

## Motion

One orchestrated thing: the sphere and the live countdown. No fade-and-slide
on sections, no hover/press flourishes beyond a 0.7 opacity press. Reduced
motion is respected (stars and the signet stand still).

## Review against the defaults

Checked against the usual generated look and changed where it matched:

- *Frosted cards on a gradient sky* (previous app) → flat page, hairline rows.
- *Serif display + warm accent* → light Plus Jakarta Sans, gold that already
  belongs to the brand.
- *Tracked all-caps eyebrows, `//` markers, middle-dot meta strings* → plain
  sentence-case labels; the only dot-joined line is the date and city.
- *Floating glass tab capsule* → a flat strip with a hairline.
- *Numbered sections* → none; nothing here is a sequence.

## Rules for new screens

1. Wrap in `<Screen>`, title with `<ScreenHeader>`; rows in `<Card>` +
   `<Divider>`; headings with `<SectionLabel>`.
2. Colours only from `usePhase().colors`; never hex in a screen.
3. Latin text with its Arabic twin where a prayer or term has one.
4. Plain, active copy: name things as the person knows them ("Next prayer",
   not "Upcoming event").

## Round 2 additions

### The day as the background
One flat colour moves with the real sun (`skyColor()` in `lib/sky.ts`),
morning and evening differ: deep navy → cold blue-grey before Fajr → pale warm
paper at sunrise → day paper → amber paper at Asr → dusky rose-brown at
Maghrib → navy at Isha. Light or dark ink is picked from the colour's
luminance, so text is always readable. Stars sit at the top of the page and
fade as you scroll away from it. No gradient, no glow.

### Five tabs
Today · Qibla · Sky · Feelings · Settings. (Sleek drew a sixth tab, Calendar;
it lives inside Sky, because iOS shows at most five tabs.) Sky = tonight's
real moon, age, next new/full moon, "eight faces of one moon", the Hijri month
grid and the next observances. Feelings = the website's tree, tappable.

### Offline first, server invisible
No spinners, no offline banners, no "sync" UI — ever.
- Everything that can be computed is computed on the device: prayer times,
  Qibla, moon, Hijri calendar, observances.
- Content ships with the app (verses and observations, the feelings map, a
  bundled city list); the server only *adds*: city search merges the bundled
  matches with `api.openathar.org/v1/places` and shows the local ones first;
  recently looked-at cities are kept.
- If a request fails the screen simply stays as it is.
