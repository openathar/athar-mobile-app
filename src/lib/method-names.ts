import type { MethodKey } from '@/context/settings';
import { t } from '@/lib/i18n';

/** The calculation methods' names in the UI language. A function: the language can change while the app runs. */
export const methodNames = (): Record<MethodKey, string> => ({
  MWL: t.methodMWL,
  ISNA: t.methodISNA,
  EGYPT: t.methodEGYPT,
  MAKKAH: t.methodMAKKAH,
  KARACHI: t.methodKARACHI,
  TEHRAN: t.methodTEHRAN,
  MALAYSIA: t.methodMALAYSIA,
  SINGAPORE: t.methodSINGAPORE,
  FRANCE: t.methodFRANCE,
  RUSSIA: t.methodRUSSIA,
});
