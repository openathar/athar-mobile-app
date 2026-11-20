# Release 1.0 — "Leave your Athar" (Plan, Stand 2026-11-20)

Ziel: Store-Release am Wochenende (21./22. November 2026). Die App wird zur
Taschen-Ausgabe von openathar.org: gleiche Nacht, gleiches Gold, gleiche
Erzählung („Eine Spur, die weitergeht"), gleicher Baum. Projektverantwortung:
Agent (Mac). Einreichung im Store: Ahmad (Konten, Signatur, Upload).

## Leitidee

Die Website erzählt *einen* Baum unter *einem* Mond. Die App übernimmt das:

- **Mond** = Zeit (Gebet, Kalender, Himmel) — Tabs Heute, Qibla, Himmel.
- **Baum** = Spur (was du hinterlässt) — neuer Tab „Baum": ein Dhikr-Baum,
  der mit jedem Tasbih wächst (Athar = Spur), darunter der Gefühlsbaum der
  Website (133 Gefühle, Äste in der Brust, Wurzeln im Bauch).

## Arbeitspakete

| # | Paket | Inhalt | Abnahme |
|---|---|---|---|
| 1 | **Willkommen** | Erster Start: Hero der Website („Eine Spur, die weitergeht."), echter Mond, drei Versprechen (kostenlos, keine Werbung, kein Tracking), Ayah 36:12; danach Ort + Benachrichtigungen erklären. Einmalig, gespeichert. | Erscheint genau einmal; „Später" überspringt; RTL korrekt |
| 2 | **Heute wie die Website** | Eyebrow-Zeile, Mond-Hero, Countdown-Pille, Ayah 36:12 unter dem Mond, dann nummerierte Kapitel `01 · …` wie auf openathar.org (Gebete, Du'a, Name des Tages, Überall, Zwei Bücher). | Gleiche Kapitel-Typo wie `lp-chap-n` |
| 3 | **Baum-Tab (neu)** | Ersetzt „Gefühle". Oben Dhikr-Baum (prozedural gezeichnet, deterministisch, wächst pro Zählung; SubhanAllah/Alhamdulillah/Allahu akbar, 33er-Runden, Vibration, lokal gespeichert, nie gesendet). Unten Port des Website-Gefühlsbaums (SVG, antippbar, Gegenstück leuchtet). | Zählung überlebt Neustart; Baum identisch bei gleichem Stand |
| 4 | **Lizenz-Hygiene** | `tree-body.png` (fremdes Bild, Körperfigur — verstößt gegen „keine figürlichen Bilder") und die Herz-Atem/Atlas/Lampe-Komponenten entfernen. Fanous-Foto (CC BY-SA 3.0) bekommt seinen Nachweis in Einstellungen → Nachweise. | Keine Assets ohne Nachweis |
| 5 | **Tests** | Node-Testrunner ohne neue Abhängigkeit (`npm test`): Baum-Generator, Tasbih-Logik, nächstes Gebet, i18n-Vollständigkeit, Gefühlsdaten. CI-Job `test`. | `npm test` + `npm run typecheck` grün |
| 6 | **Store** | Version 1.0.0, Store-Texte um Baum/Tasbih ergänzt, Release-Checkliste. | `store-listing.md` aktuell |
| 7 | **Ankündigung** | Blogartikel auf openathar.org (en/de/ar): „Athar kommt aufs Telefon". | Artikel live, Blog-Tests grün |

## Grenzen (bewusst nicht in 1.0)

- Kein eigener Adhan-Ton (entschieden 2026-11-16), kein Qur'an-Leser (Textquelle
  nicht lizenzrein), kein Sync, keine Widgets.
- Keine neuen npm-Abhängigkeiten (allow-scripts); Vibration über RN `Vibration`.

## Vor dem Einreichen (Mensch, Wochenende)

1. Gerätetest (Benachrichtigung feuert, Kompass, Ort) — `plan.md` Phase 3.
2. Muttersprachlicher Blick auf AR/PL/TR-Strings der neuen Screens.
3. `eas build -p ios --profile production` → TestFlight → Review einreichen.
4. Google Play: persönliches Konto braucht 14 Tage geschlossenen Test mit
   12 Testern — Android-Release folgt deshalb nach iOS (Artikel sagt das).
