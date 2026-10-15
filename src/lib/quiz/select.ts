import type { Question } from "../content/schema";
import { createRng, rngFor, shuffle, type Rng } from "./random";

export const DAILY_QUESTION_COUNT = 7;
export const PRACTICE_QUESTION_COUNT = 10;

const byId = (a: Question, b: Question) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Picks up to `count` questions in random order. While it can, it avoids two
 * questions about the same party; if there aren't enough party-distinct
 * questions, it fills up with the ones it skipped. Questions with no party tag
 * never clash.
 */
export function pickQuestions(pool: readonly Question[], count: number, rng: Rng): Question[] {
  // Sort first so the result depends only on which questions are in the pool.
  const candidates = shuffle([...pool].sort(byId), rng);
  const picked: Question[] = [];
  const skipped: Question[] = [];
  const usedParties = new Set<string>();

  for (const q of candidates) {
    if (picked.length === count) break;
    const parties = q.parties ?? [];
    if (parties.some((p) => usedParties.has(p))) {
      skipped.push(q);
      continue;
    }
    picked.push(q);
    for (const p of parties) usedParties.add(p);
  }
  for (const q of skipped) {
    if (picked.length === count) break;
    picked.push(q);
  }
  return picked;
}

/** Shuffles a question's options, except true/false and questions with keepOptionOrder. */
export function arrangeOptions(q: Question, rng: Rng): Question {
  if (!q.options || q.type === "true_false" || q.keepOptionOrder) return q;
  return { ...q, options: shuffle(q.options, rng) };
}

/** The ids of the daily quiz for an ISO date: the same for everyone, given the same pool. */
export function dailyQuestionIds(pool: readonly Question[], date: string): string[] {
  return pickQuestions(pool, DAILY_QUESTION_COUNT, rngFor(`daily:${date}`)).map((q) => q.id);
}

/** Option order for a daily question, stable for the whole day so a resumed quiz looks the same. */
export function arrangeDailyOptions(q: Question, date: string): Question {
  return arrangeOptions(q, rngFor(`daily:${date}:${q.id}`));
}

/** A practice run: up to 10 questions from the pool, in random order with shuffled options. */
export function practiceQuestions(pool: readonly Question[], seed: number): Question[] {
  const rng = createRng(seed);
  return pickQuestions(pool, PRACTICE_QUESTION_COUNT, rng).map((q) => arrangeOptions(q, rng));
}
