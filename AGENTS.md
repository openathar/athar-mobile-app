# AGENTS.md — athar-mobile-app

Mobile App (iOS/Android) der Athar-Plattform (openathar). Offline-first:
embedded `athan-core-java` für Gebetszeiten, kein Server-Abruf im
Normalbetrieb nötig. Optionaler Sync nur für Khatma-Fortschritt/Tasbeeh
(kein Pflicht-Account).

## Verknuepfungen
- Architektur/Roadmap: `../../AGENTS.md` (Superproject `business/athar`)
- Repo-Regeln: `~/Development/harness/agents/business-repo.md`

## Kritische Punkte
- Adhan-Timing NIE auf Push verlassen (Doze/iOS-Background unzuverlässig) —
  lokale Alarme/Notifications (siehe Superproject-AGENTS.md, Abschnitt
  "Mobile-Herausforderungen").
- Framework-Entscheidung (Flutter vs. KMP) noch offen, siehe Sprint-1-Plan.
