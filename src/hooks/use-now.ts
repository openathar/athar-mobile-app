import { useEffect, useState } from 'react';

import { clockNow } from '@/lib/clock';

/** Ticking clock — re-renders every `intervalMs`. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => clockNow());
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
