// Icelandic formatting for dates and numbers.

const numberFormat = new Intl.NumberFormat("is-IS");
const longDate = new Intl.DateTimeFormat("is-IS", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function isoToUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** "2026-10-15" → "fimmtudagur 15. október" */
export function formatLongDate(date: string): string {
  return longDate
    .formatToParts(isoToUtcDate(date))
    .map((part) => (part.type === "literal" && part.value.trim() === "," ? " " : part.value))
    .join("")
    .replace(/\s+/g, " ");
}

/** "2026-10-15" → "15.10." */
export function formatShortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day}.${month}.`;
}

/** 1234567.5 → "1.234.567,5" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}
