// Deterministic pseudo-randomness. The daily quiz must give every player the same
// questions (and option order) for a given date, so it is seeded rather than
// using Math.random.

export type Rng = () => number;

/** 32-bit FNV-1a hash of a string. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a small, fast PRNG returning floats in [0, 1). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An Rng seeded from a string key, e.g. "daily:2026-10-15". */
export function rngFor(key: string): Rng {
  return createRng(hashString(key));
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** A fresh random seed for a practice run. Call from event handlers or state initialisers, not render. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
