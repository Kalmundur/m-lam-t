// Content constants and small helpers with no dependency on Zod, so client
// components can import them without pulling the schema into the browser bundle.

export const CATEGORIES = [
  "kerfid",
  "flokkarnir",
  "stefna",
  "atkvaedi",
  "tolur",
  "folkid",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "who_promised",
  "vote_record",
  "estimate",
  "true_false",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const STATUSES = ["verified", "placeholder"] as const;
export type Status = (typeof STATUSES)[number];

/** Estimate tolerances, as a fraction of the correct answer (0.1 = ±10%). */
export const DEFAULT_FULL_TOLERANCE = 0.1;
export const DEFAULT_PARTIAL_TOLERANCE = 0.25;

/** A true_false question must use exactly these option ids, in this order. */
export const TRUE_FALSE_OPTION_IDS = ["true", "false"] as const;

/**
 * Pseudo-party ids for placeholder questions, so placeholders never attribute
 * made-up positions or votes to a real party. Verified questions may not use them.
 */
export const PLACEHOLDER_PARTY_IDS = ["X1", "X2", "X3"] as const;

/** reviewedBy value for seed questions that still need a human sign-off. */
export const PENDING_REVIEWER = "pending-human";

/** Categories whose facts change over time and therefore need validUntil. */
export const CATEGORIES_REQUIRING_VALID_UNTIL: readonly Category[] = ["folkid"];

type EstimateRange = { min: number; max: number; step?: number };
type EstimateTolerances = { fullTolerance?: number; partialTolerance?: number };

/**
 * Slider step for an estimate question: the explicit `step`, or 1 for integer
 * ranges up to 200 wide, or else a power of ten giving roughly 100–1000 steps.
 */
export function estimateStep({ min, max, step }: EstimateRange): number {
  if (step !== undefined) return step;
  const range = max - min;
  const integerBounds = Number.isInteger(min) && Number.isInteger(max);
  if (integerBounds && range <= 200) return 1;
  const power = 10 ** Math.floor(Math.log10(range / 100));
  return integerBounds ? Math.max(1, power) : power;
}

export function estimateTolerances(e: EstimateTolerances): { full: number; partial: number } {
  return {
    full: e.fullTolerance ?? DEFAULT_FULL_TOLERANCE,
    partial: e.partialTolerance ?? DEFAULT_PARTIAL_TOLERANCE,
  };
}

/** Whether `value` lies on the slider grid min, min + step, …, max (allowing for float error). */
export function isOnStepGrid(value: number, range: EstimateRange): boolean {
  const steps = (value - range.min) / estimateStep(range);
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}
