import { CATEGORIES, type Category } from "../content/constants";
import type { Outcome, ScoredAnswer } from "./scoring";

// The daily quiz is stored per device in localStorage, one record per Icelandic
// date. These functions are pure; reading and writing storage happens elsewhere.

export const DAILY_STORAGE_KEY = "malamot.daily.v1";
/** Enough history for a year-long streak. */
export const HISTORY_DAYS_KEPT = 400;

export type DailyRecord = {
  date: string;
  questionIds: string[];
  answers: ScoredAnswer[];
  finished: boolean;
};
export type DailyHistory = Record<string, DailyRecord>;

const OUTCOMES: readonly Outcome[] = ["correct", "partial", "wrong"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isAnswer(value: unknown): value is ScoredAnswer {
  const a = value as ScoredAnswer;
  return (
    typeof a === "object" &&
    a !== null &&
    typeof a.questionId === "string" &&
    CATEGORIES.includes(a.category as Category) &&
    (typeof a.response === "string" || typeof a.response === "number") &&
    OUTCOMES.includes(a.outcome)
  );
}

function isRecord(value: unknown, date: string): value is DailyRecord {
  const r = value as DailyRecord;
  return (
    typeof r === "object" &&
    r !== null &&
    r.date === date &&
    Array.isArray(r.questionIds) &&
    r.questionIds.every((id) => typeof id === "string") &&
    Array.isArray(r.answers) &&
    r.answers.every(isAnswer) &&
    typeof r.finished === "boolean"
  );
}

/** Parses stored history, dropping anything malformed. Never throws. */
export function parseDailyHistory(raw: string | null | undefined): DailyHistory {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
  const history: DailyHistory = {};
  for (const [date, record] of Object.entries(data)) {
    if (ISO_DATE.test(date) && isRecord(record, date)) history[date] = record;
  }
  return history;
}

/** Serialises history, keeping only the most recent days. */
export function serializeDailyHistory(history: DailyHistory): string {
  const recent = Object.keys(history).sort().slice(-HISTORY_DAYS_KEPT);
  return JSON.stringify(Object.fromEntries(recent.map((date) => [date, history[date]])));
}

export function newDailyRecord(date: string, questionIds: string[]): DailyRecord {
  return { date, questionIds, answers: [], finished: false };
}

/** Adds an answer unless that question was already answered (e.g. a double submit). */
export function addAnswer(record: DailyRecord, answer: ScoredAnswer): DailyRecord {
  if (record.answers.some((a) => a.questionId === answer.questionId)) return record;
  return { ...record, answers: [...record.answers, answer] };
}

export function finishRecord(record: DailyRecord): DailyRecord {
  return { ...record, finished: true };
}
