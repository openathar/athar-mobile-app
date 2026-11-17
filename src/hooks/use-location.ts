import { useLocationContext } from '@/context/location';
import { t } from '@/lib/i18n';

/** The label the auto-detected position carries inside the context (a fixed key, not a translation). */
const AUTO_LABEL = 'Current location';

/**
 * Convenience hook — reads the shared location state (see LocationProvider). The auto-detected
 * position is shown in the app's language; the provider sits above the language switch, so the
 * translation happens here, at render time.
 */
export function useLocation() {
  const ctx = useLocationContext();
  const label = ctx.location.label === AUTO_LABEL ? t.currentLocation : ctx.location.label;
  return label === ctx.location.label ? ctx : { ...ctx, location: { ...ctx.location, label } };
}
