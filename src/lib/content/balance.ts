import { isActive } from "./availability";
import { CATEGORIES, type Category, type Party, type Question } from "./schema";

/** Categories where uneven party coverage would make the quiz look partisan. */
export const BALANCE_CHECKED_CATEGORIES: readonly Category[] = ["stefna", "atkvaedi", "flokkarnir"];
/** Warn when a party's count is above this multiple of the category average… */
export const BALANCE_UPPER_RATIO = 1.5;
/** …or below this multiple. */
export const BALANCE_LOWER_RATIO = 0.5;

export type BalanceWarning = {
  category: Category;
  party: string;
  count: number;
  average: number;
  ratio: number;
};

export type BalanceReport = {
  /** Every registered party; counts are reported for all of them. */
  parties: Party[];
  /** Letters of the parties with inBalanceCheck: true. Only these are averaged and warned about. */
  checkedParties: string[];
  /** counts[letter][category]: active verified questions tagged with that party. */
  counts: Record<string, Record<Category, number>>;
  totals: Record<string, number>;
  /** Active verified questions per category, tagged or not. */
  questionsPerCategory: Record<Category, number>;
  /** Average per-party count in each category, over the checked parties. */
  averages: Record<Category, number>;
  warnings: BalanceWarning[];
  /** Checked categories where no balance-checked party has a verified question yet. */
  noData: Category[];
};

function zeroes(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
}

/**
 * Counts how many active, verified questions concern each party. A question
 * tagged with several parties counts once for each. Placeholders and expired
 * questions are ignored because players never see them. Averages and warnings
 * only consider parties with inBalanceCheck: true.
 */
export function computeBalance(questions: Question[], parties: Party[], today: string): BalanceReport {
  const counts: Record<string, Record<Category, number>> = Object.fromEntries(
    parties.map((p) => [p.letter, zeroes()]),
  );
  const questionsPerCategory = zeroes();

  for (const q of questions) {
    if (q.status !== "verified" || !isActive(q, today)) continue;
    questionsPerCategory[q.category]++;
    for (const letter of new Set(q.parties ?? [])) {
      // Unknown letters are a validation error, reported by validate.ts.
      if (counts[letter]) counts[letter][q.category]++;
    }
  }

  const totals = Object.fromEntries(
    parties.map((p) => [p.letter, CATEGORIES.reduce((sum, c) => sum + counts[p.letter][c], 0)]),
  );
  const checked = parties.filter((p) => p.inBalanceCheck);
  const averages = zeroes();
  for (const c of CATEGORIES) {
    averages[c] = checked.length ? checked.reduce((sum, p) => sum + counts[p.letter][c], 0) / checked.length : 0;
  }

  const warnings: BalanceWarning[] = [];
  const noData: Category[] = [];
  for (const category of BALANCE_CHECKED_CATEGORIES) {
    const average = averages[category];
    if (average === 0) {
      noData.push(category);
      continue;
    }
    for (const p of checked) {
      const count = counts[p.letter][category];
      const ratio = count / average;
      if (ratio > BALANCE_UPPER_RATIO || ratio < BALANCE_LOWER_RATIO) {
        warnings.push({ category, party: p.letter, count, average, ratio });
      }
    }
  }

  return {
    parties,
    checkedParties: checked.map((p) => p.letter),
    counts,
    totals,
    questionsPerCategory,
    averages,
    warnings,
    noData,
  };
}
