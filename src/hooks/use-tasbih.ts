import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { count, initialState, parseState, type Milestone, type TasbihState } from '@/lib/tasbih';

const STORAGE_KEY = 'athar.tasbih.v1';

/**
 * The tasbih count and the tree's seed, kept on the device only (AsyncStorage,
 * never sent anywhere). Writes are debounced so fast counting stays smooth.
 */
export function useTasbih() {
  const [state, setState] = useState<TasbihState | null>(null);
  const latest = useRef<TasbihState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const seed = Math.floor(Math.random() * 2 ** 32);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => parseState(raw, seed, new Date()))
      .catch(() => initialState(seed, new Date()))
      .then((s) => {
        if (cancelled) return;
        latest.current = s;
        setState(s);
        // Plant the seed right away, so the tree keeps its shape from the first look.
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((s: TasbihState) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => undefined);
    }, 400);
  }, []);

  // Flush a pending write when the screen goes away.
  useEffect(
    () => () => {
      if (timer.current && latest.current) {
        clearTimeout(timer.current);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)).catch(() => undefined);
      }
    },
    []
  );

  const tap = useCallback((): Milestone => {
    const cur = latest.current;
    if (!cur) return 'none';
    const res = count(cur, new Date());
    latest.current = res.state;
    setState(res.state);
    persist(res.state);
    return res.milestone;
  }, [persist]);

  /** Starts the count over; the tree keeps its seed (it is still yours), only its size resets. */
  const reset = useCallback(() => {
    const cur = latest.current;
    if (!cur) return;
    const s = initialState(cur.seed, new Date());
    latest.current = s;
    setState(s);
    persist(s);
  }, [persist]);

  return { state, tap, reset };
}
