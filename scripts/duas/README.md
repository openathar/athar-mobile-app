# Du'a data (`src/data/duas.ts`)

Generated, not typed. The Arabic of every du'a is cut verbatim — vowelling
included — out of the classical hadith collections, so no wording comes from
memory.

1. Download the Arabic editions of the open dataset
   [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) into
   `/tmp/hadith/` (`ara-bukhari.json`, `ara-muslim.json`, `ara-abudawud.json`,
   `ara-tirmidhi.json`, `ara-ibnmajah.json`):
   `curl -o /tmp/hadith/ara-<c>.json https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-<c>.json`
2. `batch.py` locates each du'a by its opening and closing words (compared
   without vowel marks) and the standard hadith number, and writes
   `/tmp/hadith/duas.json` with the grades given in the dataset.
3. `gen.py` adds the meanings (written for Athar, not copied from a
   published translation), the occasion stated in the hadith, the count where
   the hadith gives one, and the time-of-day grouping, and writes
   `src/data/duas.ts`.

Licence: the dataset is released under the Unlicense (public domain); the
classical Arabic texts themselves are public domain.

Rules: only narrations graded sahih or hasan — Bukhari/Muslim, otherwise
al-Albani's grade of the hadith itself as given in the dataset. A grade of the
chain alone ("Hasan Isnaad") is not enough, so Abu Dawud 5090 is left out. A
da'if from another grader beside al-Albani's sahih/hasan does not remove a
du'a (Tirmidhi 2140, 3451, 3513, 3585 and Ibn Majah 925 carry one from Zubair
Ali Zai). The meanings still need a scholarly review before release.

Set `HADITH_DIR` to the folder with the editions if it is not `/tmp/hadith`.

`gen.py` also writes the order rules: `DUAS_BY_PHASE` (part of the day),
`DUAS_SPECIAL` (Hijri month/day: Ramadan, the last ten nights, Arafah, the new
crescent) and `DUA_AFTER_PRAYER`. The choice itself is `src/lib/dua-pick.ts`.
