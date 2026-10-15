import { z } from "zod";

// Shared by the app (runtime loading) and the scripts (validate, balance).
// Rules that only need a single question live here; rules that need the whole
// question set or the party registry live in validate.ts.

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

const OPTION_COUNT: Record<Exclude<QuestionType, "estimate">, [number, number]> = {
  multiple_choice: [3, 4],
  who_promised: [3, Infinity],
  vote_record: [2, 4],
  true_false: [2, 2],
};

const nonEmpty = z.string().trim().min(1);
export const isoDate = z.iso.date();

export const OptionSchema = z.strictObject({
  id: nonEmpty,
  text: nonEmpty,
});
export type Option = z.infer<typeof OptionSchema>;

export const SourceSchema = z.strictObject({
  title: nonEmpty,
  url: z.url({ protocol: /^https?$/ }),
  accessed: isoDate,
});
export type Source = z.infer<typeof SourceSchema>;

export const EstimateSchema = z
  .strictObject({
    answer: z.number(),
    min: z.number(),
    max: z.number(),
    unit: z.string(),
    fullTolerance: z.number().min(0).max(1).optional(),
    partialTolerance: z.number().min(0).max(1).optional(),
  })
  .superRefine((e, ctx) => {
    if (e.min >= e.max) {
      ctx.addIssue({ code: "custom", path: ["max"], message: "max must be greater than min" });
    }
    if (e.answer < e.min || e.answer > e.max) {
      ctx.addIssue({ code: "custom", path: ["answer"], message: "answer must lie between min and max" });
    }
    if (e.answer === 0) {
      // Tolerances are relative to the answer, so 0 would only accept an exact hit.
      ctx.addIssue({ code: "custom", path: ["answer"], message: "answer must not be 0 (tolerances are relative)" });
    }
    const full = e.fullTolerance ?? DEFAULT_FULL_TOLERANCE;
    const partial = e.partialTolerance ?? DEFAULT_PARTIAL_TOLERANCE;
    if (full > partial) {
      ctx.addIssue({
        code: "custom",
        path: ["fullTolerance"],
        message: `fullTolerance (${full}) must not exceed partialTolerance (${partial})`,
      });
    }
  });
export type Estimate = z.infer<typeof EstimateSchema>;

export const QuestionSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z]+-\d{4}$/, 'id must look like "kerfid-0001"'),
    type: z.enum(QUESTION_TYPES),
    category: z.enum(CATEGORIES),
    prompt: nonEmpty,
    options: z.array(OptionSchema).optional(),
    correctOptionId: nonEmpty.optional(),
    estimate: EstimateSchema.optional(),
    explanation: nonEmpty,
    sources: z.array(SourceSchema),
    parties: z.array(nonEmpty).optional(),
    validFrom: isoDate.optional(),
    validUntil: isoDate.optional(),
    status: z.enum(STATUSES),
    reviewedBy: nonEmpty.optional(),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .superRefine((q, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (q.status === "verified") {
      if (q.sources.length === 0) issue(["sources"], "verified questions need at least one source");
      if (!q.reviewedBy) issue(["reviewedBy"], "verified questions need reviewedBy");
      if (CATEGORIES_REQUIRING_VALID_UNTIL.includes(q.category) && !q.validUntil) {
        issue(["validUntil"], `verified "${q.category}" questions need validUntil, because the facts change`);
      }
    }

    if (q.validFrom && q.validUntil && q.validFrom > q.validUntil) {
      issue(["validUntil"], "validUntil must not be before validFrom");
    }

    if (q.type === "estimate") {
      if (!q.estimate) issue(["estimate"], "estimate questions need an estimate block");
      if (q.options) issue(["options"], "estimate questions must not have options");
      if (q.correctOptionId) issue(["correctOptionId"], "estimate questions must not have correctOptionId");
      return;
    }

    if (q.estimate) issue(["estimate"], `${q.type} questions must not have an estimate block`);
    if (!q.options) {
      issue(["options"], `${q.type} questions need options`);
      return;
    }

    const [minOptions, maxOptions] = OPTION_COUNT[q.type];
    if (q.options.length < minOptions || q.options.length > maxOptions) {
      const range = maxOptions === Infinity ? `at least ${minOptions}` : minOptions === maxOptions ? `exactly ${minOptions}` : `${minOptions}–${maxOptions}`;
      issue(["options"], `${q.type} questions need ${range} options (has ${q.options.length})`);
    }

    const ids = q.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) issue(["options"], "option ids must be unique");
    const texts = q.options.map((o) => o.text.toLocaleLowerCase("is"));
    if (new Set(texts).size !== texts.length) issue(["options"], "option texts must be unique");

    if (!q.correctOptionId) {
      issue(["correctOptionId"], `${q.type} questions need correctOptionId`);
    } else if (!ids.includes(q.correctOptionId)) {
      issue(["correctOptionId"], `correctOptionId "${q.correctOptionId}" is not one of the option ids`);
    }

    if (q.type === "true_false" && ids.join() !== TRUE_FALSE_OPTION_IDS.join()) {
      issue(["options"], `true_false options must have ids ${JSON.stringify(TRUE_FALSE_OPTION_IDS)}, in that order`);
    }

    // The balance report relies on who_promised questions being tagged with the party that made the promise.
    if (q.type === "who_promised" && q.correctOptionId && !q.parties?.includes(q.correctOptionId)) {
      issue(["parties"], "who_promised questions must list the correct party in parties");
    }
  });
export type Question = z.infer<typeof QuestionSchema>;

export const PartySchema = z.strictObject({
  letter: z.string().regex(/^[A-ZÁÐÉÍÓÚÝÞÆÖ]$/, "letter must be a single capital letter"),
  /** The name as Landskjörstjórn lists it. */
  name: nonEmpty,
  /** Shorter display name, e.g. "Samfylkingin" for "Samfylkingin – jafnaðarmannaflokkur Íslands". */
  shortName: nonEmpty.optional(),
  /** Holds seats in Alþingi. */
  inAlthingi: z.boolean(),
  /** Counted by the balance report's averages and warnings. */
  inBalanceCheck: z.boolean(),
});
export type Party = z.infer<typeof PartySchema>;

export const PartyRegistrySchema = z.strictObject({
  sources: z.array(SourceSchema).min(1),
  parties: z.array(PartySchema).min(1),
});
export type PartyRegistry = z.infer<typeof PartyRegistrySchema>;

export const RetiredIdsSchema = z.array(z.string());
