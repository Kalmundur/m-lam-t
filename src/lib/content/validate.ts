import { isExpired } from "./availability";
import {
  CATEGORIES,
  PENDING_REVIEWER,
  PLACEHOLDER_PARTY_IDS,
  PartyRegistrySchema,
  QuestionSchema,
  RetiredIdsSchema,
  type Category,
  type PartyRegistry,
  type Question,
} from "./schema";

// Validates the whole content set: every question file, the party registry and
// the retired-id list. Pure (no file system access) so it is easy to test and
// can run anywhere; scripts/validate.ts does the file reading and reporting.

export type Issue = {
  level: "error" | "warning";
  file: string;
  questionId?: string;
  message: string;
};

export type ContentFile = { file: string; data: unknown };

export type ContentInput = {
  /** One entry per file in content/questions/. */
  questionFiles: ContentFile[];
  parties: ContentFile;
  retiredIds: ContentFile;
  /** ISO date used for expiry checks. */
  today: string;
};

export type ValidationResult = {
  /** Every question that passed validation, placeholders and expired ones included. */
  questions: Question[];
  registry: PartyRegistry | null;
  errors: Issue[];
  warnings: Issue[];
  /** Past validUntil: excluded from the app until a human reviews them. */
  expired: Question[];
  /** Verified questions whose reviewedBy is still "pending-human". */
  pendingReview: Question[];
};

/** Explanations should be one or two sentences; this catches the ones that clearly are not. */
export const MAX_EXPLANATION_LENGTH = 300;

type ZodLikeIssue = { path: PropertyKey[]; message: string };

function formatIssue(issue: ZodLikeIssue): string {
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

function fileCategory(file: string): string {
  return (file.split(/[\\/]/).pop() ?? file).replace(/\.json$/, "");
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function validateContent(input: ContentInput): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const error = (file: string, message: string, questionId?: string) =>
    errors.push({ level: "error", file, questionId, message });
  const warn = (file: string, message: string, questionId?: string) =>
    warnings.push({ level: "warning", file, questionId, message });

  // Party registry
  let registry: PartyRegistry | null = null;
  const registryResult = PartyRegistrySchema.safeParse(input.parties.data);
  if (registryResult.success) {
    registry = registryResult.data;
    const seen = new Set<string>();
    for (const party of registry.parties) {
      if (seen.has(party.letter)) error(input.parties.file, `duplicate party letter "${party.letter}"`);
      seen.add(party.letter);
    }
    const groupOwner = new Map<number, string>();
    for (const party of registry.parties) {
      for (const groupId of party.althingiGroupIds ?? []) {
        const owner = groupOwner.get(groupId);
        if (owner) error(input.parties.file, `Alþingi group ${groupId} is listed for both ${owner} and ${party.letter}`);
        groupOwner.set(groupId, party.letter);
      }
    }
    if (!registry.parties.some((p) => p.inBalanceCheck)) {
      warn(input.parties.file, "no party has inBalanceCheck: true, so the balance report checks nothing");
    }
  } else {
    for (const issue of registryResult.error.issues) error(input.parties.file, formatIssue(issue));
  }
  const partyLetters = new Set(registry?.parties.map((p) => p.letter));
  const placeholderPartyIds = new Set<string>(PLACEHOLDER_PARTY_IDS);
  const partyNames = new Map(
    registry?.parties.map((p) => [p.letter, [p.name, p.shortName].filter((n): n is string => !!n)]),
  );

  // Retired ids
  const retiredResult = RetiredIdsSchema.safeParse(input.retiredIds.data);
  if (!retiredResult.success) {
    for (const issue of retiredResult.error.issues) error(input.retiredIds.file, formatIssue(issue));
  }
  const retired = new Set(retiredResult.success ? retiredResult.data : []);

  // Questions
  const questions: Question[] = [];
  const idToFile = new Map<string, string>();
  const categoriesWithFile = new Set<Category>();

  for (const { file, data } of input.questionFiles) {
    const category = fileCategory(file);
    if (!isCategory(category)) {
      error(file, `unexpected file; question files must be named ${CATEGORIES.map((c) => `${c}.json`).join(", ")}`);
      continue;
    }
    categoriesWithFile.add(category);
    if (!Array.isArray(data)) {
      error(file, "file must contain a JSON array of questions");
      continue;
    }

    data.forEach((raw: unknown, index) => {
      const rawId = (raw as { id?: unknown } | null)?.id;
      const label = typeof rawId === "string" ? rawId : `#${index}`;
      const parsed = QuestionSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) error(file, formatIssue(issue), label);
        return;
      }
      const q = parsed.data;
      const errorCountBefore = errors.length;

      if (q.category !== category) {
        error(file, `category "${q.category}" does not match the file it is in`, q.id);
      }
      if (!q.id.startsWith(`${q.category}-`)) {
        warn(file, `id does not start with "${q.category}-"; fine if the question was moved, but new ids should`, q.id);
      }

      const otherFile = idToFile.get(q.id);
      if (otherFile) error(file, `duplicate id (also in ${otherFile})`, q.id);
      idToFile.set(q.id, file);
      if (retired.has(q.id)) error(file, `id is retired (${input.retiredIds.file}); ids must never be reused`, q.id);

      // Party references: real letters for verified questions, pseudo-parties allowed in placeholders.
      const isKnownParty = (id: string) =>
        partyLetters.has(id) || (q.status === "placeholder" && placeholderPartyIds.has(id));
      for (const letter of q.parties ?? []) {
        if (!isKnownParty(letter)) error(file, `parties: unknown party "${letter}"`, q.id);
      }
      if (q.type === "who_promised") {
        for (const option of q.options ?? []) {
          if (!isKnownParty(option.id)) error(file, `options: "${option.id}" is not a known party letter`, q.id);
        }
        const prompt = q.prompt.toLocaleLowerCase("is");
        for (const option of q.options ?? []) {
          const names = [option.text, ...(partyNames.get(option.id) ?? [])];
          const revealed = names.find((n) => prompt.includes(n.toLocaleLowerCase("is")));
          if (revealed) warn(file, `prompt mentions "${revealed}"; who_promised prompts should be anonymised`, q.id);
        }
      }

      if (q.explanation.length > MAX_EXPLANATION_LENGTH) {
        warn(file, `explanation is ${q.explanation.length} characters; aim for one or two sentences`, q.id);
      }
      for (const source of q.sources) {
        if (source.accessed > input.today) warn(file, `source "${source.title}" has an accessed date in the future`, q.id);
      }

      if (errors.length === errorCountBefore) questions.push(q);
    });
  }

  for (const category of CATEGORIES) {
    if (!categoriesWithFile.has(category)) warn(`content/questions/${category}.json`, "category file is missing");
  }

  const expired = questions.filter((q) => isExpired(q, input.today));
  for (const q of expired) {
    warn(idToFile.get(q.id) ?? "", `validUntil ${q.validUntil} has passed; hidden from players until reviewed`, q.id);
  }
  const pendingReview = questions.filter((q) => q.status === "verified" && q.reviewedBy === PENDING_REVIEWER);

  return { questions, registry, errors, warnings, expired, pendingReview };
}
