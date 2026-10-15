// Icelandic formatting for dates and numbers. Done by hand rather than with
// Intl, because some browsers (and headless test browsers) lack Icelandic
// locale data and silently fall back to English.

import { is } from "../i18n/is";

function parseIsoDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/** "2026-10-15" → "fimmtudagur 15. október" */
export function formatLongDate(date: string): string {
  const { year, month, day } = parseIsoDate(date);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${is.dates.weekdays[weekday]} ${day}. ${is.dates.months[month - 1]}`;
}

/** "2026-10-15" → "15.10." */
export function formatShortDate(date: string): string {
  const { month, day } = parseIsoDate(date);
  return `${day}.${month}.`;
}

/** 1234567.5 → "1.234.567,5" (at most three decimals). */
export function formatNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const [whole, fraction] = String(Number(Math.abs(value).toFixed(3))).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + grouped + (fraction ? `,${fraction}` : "");
}
