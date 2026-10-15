"use client";

import { useSyncExternalStore } from "react";
import { icelandToday } from "./content/availability";
import { readStorage, subscribeStorage } from "./storage";

// The site is prerendered at build time, so anything that depends on the
// visitor (today's date, their stored progress) is read on the client only.
// During prerender and hydration these hooks return their "not known yet" value.

function subscribeToClock(onChange: () => void): () => void {
  // Re-check once a minute so an open page rolls over at midnight.
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/** Today's date in Iceland (YYYY-MM-DD), or null before the client has rendered. */
export function useIcelandToday(): string | null {
  return useSyncExternalStore(subscribeToClock, () => icelandToday(), () => null);
}

/** The raw stored string for a key; null if absent or storage is unavailable, undefined before the client has rendered. */
export function useStoredValue(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => undefined,
  );
}
