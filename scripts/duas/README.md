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

Rules: only narrations graded sahih or hasan (Bukhari/Muslim, otherwise
al-Albani as given in the dataset); a du'a whose grading is disputed between
sahih/hasan and da'if is left out (e.g. Abu Dawud 5090). The meanings still
need a scholarly review before release.
