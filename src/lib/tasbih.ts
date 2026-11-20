/**
 * Tasbih — the counting behind the dhikr tree. Pure functions (no React
 * Native), so the rules are tested under `node --test`.
 *
 * One round is the tasbih the Prophet ﷺ taught Fatimah: SubhanAllah 33 times,
 * Alhamdulillah 33 times, Allahu akbar 34 times — a hundred in all
 * (Sahih al-Bukhari 6318, Sahih Muslim 2727). The count never leaves the device.
 */

export type PhraseKey = 'subhan' | 'hamd' | 'akbar';

export const PHRASES: readonly { key: PhraseKey; ar: string; times: number }[] = [
  { key: 'subhan', ar: 'سُبْحَانَ ٱللَّٰهِ', times: 33 },
  { key: 'hamd', ar: 'ٱلْحَمْدُ لِلَّٰهِ', times: 33 },
  { key: 'akbar', ar: 'ٱللَّٰهُ أَكْبَرُ', times: 34 },
];

export const ROUND = PHRASES.reduce((n, p) => n + p.times, 0);

export type TasbihState = {
  /** Every count since the tree was planted. */
  total: number;
  /** Counts on the local calendar day `day` (YYYY-MM-DD). */
  today: number;
  day: string;
  /** The tree's seed: one tree per person, planted on the first open. */
  seed: number;
};

export type Position = {
  phrase: (typeof PHRASES)[number];
  index: number;
  /** 0-based count inside the current phrase. */
  inPhrase: number;
  rounds: number;
};

/** Local calendar day as YYYY-MM-DD (not UTC: "today" ends at the user's midnight). */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function initialState(seed: number, now: Date): TasbihState {
  return { total: 0, today: 0, day: dayKey(now), seed: seed >>> 0 };
}

/** Where a total stands in the 33/33/34 round. */
export function position(total: number): Position {
  const t = Math.max(0, Math.floor(total));
  const rounds = Math.floor(t / ROUND);
  let rest = t % ROUND;
  for (let i = 0; i < PHRASES.length; i++) {
    if (rest < PHRASES[i].times) return { phrase: PHRASES[i], index: i, inPhrase: rest, rounds };
    rest -= PHRASES[i].times;
  }
  // Unreachable: rest < ROUND always lands in a phrase.
  return { phrase: PHRASES[0], index: 0, inPhrase: 0, rounds };
}

/** What the next tap completes: a phrase (switch the words) or a whole round (a blossom opens). */
export type Milestone = 'none' | 'phrase' | 'round';

export function count(state: TasbihState, now: Date): { state: TasbihState; milestone: Milestone } {
  const day = dayKey(now);
  const total = state.total + 1;
  const next: TasbihState = { ...state, total, day, today: (state.day === day ? state.today : 0) + 1 };
  const pos = position(total);
  const milestone: Milestone = pos.index === 0 && pos.inPhrase === 0 ? 'round' : pos.inPhrase === 0 ? 'phrase' : 'none';
  return { state: next, milestone };
}

/** The today counter as shown: zero once the day has turned, even before the next tap. */
export function todayCount(state: TasbihState, now: Date): number {
  return state.day === dayKey(now) ? state.today : 0;
}

/** Parse what AsyncStorage gave back; anything malformed starts a fresh tree. */
export function parseState(raw: string | null, fallbackSeed: number, now: Date): TasbihState {
  if (!raw) return initialState(fallbackSeed, now);
  try {
    const v = JSON.parse(raw) as Partial<TasbihState>;
    const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
    if (!ok(v.total) || !ok(v.today) || !ok(v.seed) || typeof v.day !== 'string') return initialState(fallbackSeed, now);
    return { total: Math.floor(v.total), today: Math.floor(v.today), day: v.day, seed: v.seed >>> 0 };
  } catch {
    return initialState(fallbackSeed, now);
  }
}
