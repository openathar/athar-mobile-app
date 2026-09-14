# AGENTS.md — athar-mobile-app

Mobile app (iOS/Android) of the Athar platform (openathar). Offline-first:
embeds `athan-core-java` for prayer times, no server call needed in normal
operation. Optional sync only for Khatma progress/Tasbeeh (no mandatory
account).

## Links

- Architecture/roadmap: `../../AGENTS.md` (superproject `business/athar`)
- Repo conventions: `~/Development/harness/agents/business-repo.md`

## Critical points

- NEVER rely on push for Adhan timing (Doze/iOS background are unreliable)
  — use local alarms/notifications (see the superproject AGENTS.md,
  "Mobile constraints" section).
- Framework decision (Flutter vs. Kotlin Multiplatform) still open — see
  the "Next steps" section in `docs/architecture.md`.

## Current state

Scaffold only — no code yet, and deliberately last in the build order:
this only makes sense once `athan-core-java` is embeddable as a library.

## APM (Agent Package Manager)

Projekt-lokale Skills/Agents/Commands werden über `apm.yaml` verwaltet
(Registry-Quelle: `~/Development/harness/registry/`).
- `apm install --local` — installiert die in `apm.yaml` gelisteten Packages
- `apm status --local` — prüft Installations-Stand gegen die Registry
