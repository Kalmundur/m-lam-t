import { CATEGORIES, estimateTolerance, type Category } from "../content/constants";
import type { Question } from "../content/schema";

/** An option id for choice questions, or the guessed number for estimates. */
export type Response = string | number;
/** Every question, estimates included, is either right or wrong: no partial points. */
export type Outcome = "correct" | "wrong";

export const POINTS: Record<Outcome, number> = { correct: 1, wrong: 0 };

/** Allows for floating-point error at the tolerance boundary (e.g. 63 × 1.1). */
const EPSILON = 1e-9;

export function scoreAnswer(q: Question, response: Response): Outcome {
  if (q.type === "estimate") {
    if (!q.estimate || typeof response !== "number" || !Number.isFinite(response)) return "wrong";
    const error = Math.abs(response - q.estimate.answer) / Math.abs(q.estimate.answer);
    return error <= estimateTolerance(q.estimate) + EPSILON ? "correct" : "wrong";
  }
  return response === q.correctOptionId ? "correct" : "wrong";
}

/** What gets stored per answered question. Category is kept so history survives content changes. */
export type ScoredAnswer = {
  questionId: string;
  category: Category;
  response: Response;
  outcome: Outcome;
};

export function answerQuestion(q: Question, response: Response): ScoredAnswer {
  return { questionId: q.id, category: q.category, response, outcome: scoreAnswer(q, response) };
}

export type CategoryScore = { category: Category; points: number; max: number };

export type Summary = {
  points: number;
  max: number;
  /** Categories that appeared, in the standard category order. */
  byCategory: CategoryScore[];
  /** Best and weakest category, when more than one appeared and they differ. */
  strongest?: Category;
  weakest?: Category;
};

export function summarize(answers: readonly ScoredAnswer[]): Summary {
  const scores = new Map<Category, CategoryScore>();
  for (const a of answers) {
    const score = scores.get(a.category) ?? { category: a.category, points: 0, max: 0 };
    score.points += POINTS[a.outcome];
    score.max += 1;
    scores.set(a.category, score);
  }
  const byCategory = CATEGORIES.flatMap((c) => scores.get(c) ?? []);
  const points = byCategory.reduce((sum, c) => sum + c.points, 0);
  const max = byCategory.reduce((sum, c) => sum + c.max, 0);

  const summary: Summary = { points, max, byCategory };
  if (byCategory.length > 1) {
    const ratio = (c: CategoryScore) => c.points / c.max;
    // Ties go to the category listed first, so the wording is stable.
    const strongest = byCategory.reduce((best, c) => (ratio(c) > ratio(best) ? c : best));
    const weakest = byCategory.reduce((worst, c) => (ratio(c) < ratio(worst) ? c : worst));
    if (ratio(strongest) > ratio(weakest)) {
      summary.strongest = strongest.category;
      summary.weakest = weakest.category;
    }
  }
  return summary;
}
