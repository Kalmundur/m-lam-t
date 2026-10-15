import type { Question } from "./schema";

/**
 * Today's date in Iceland as an ISO date string (YYYY-MM-DD). Everyone gets the
 * same daily quiz and the same validFrom/validUntil cut-off, wherever the device is.
 */
export function icelandToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Atlantic/Reykjavik",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// ISO dates compare correctly as strings. validFrom and validUntil are inclusive.

export function isExpired(q: Pick<Question, "validUntil">, today: string): boolean {
  return q.validUntil !== undefined && q.validUntil < today;
}

export function isNotYetValid(q: Pick<Question, "validFrom">, today: string): boolean {
  return q.validFrom !== undefined && q.validFrom > today;
}

export function isActive(q: Pick<Question, "validFrom" | "validUntil">, today: string): boolean {
  return !isExpired(q, today) && !isNotYetValid(q, today);
}

export type AvailabilityOptions = {
  today: string;
  /** Mirrors NEXT_PUBLIC_SHOW_PLACEHOLDERS=true. Never enable in production. */
  showPlaceholders: boolean;
};

/** Whether a (schema-valid) question may be shown to a player. */
export function isPlayable(q: Question, { today, showPlaceholders }: AvailabilityOptions): boolean {
  if (q.status === "placeholder" && !showPlaceholders) return false;
  return isActive(q, today);
}
