import { describe, expect, it } from "vitest";
import { computeBalance } from "../src/lib/content/balance";
import { validateContent } from "../src/lib/content/validate";
import { readContent } from "./lib/content-files";

// Runs the real content in content/ through the same checks as `npm run validate`
// and `npm run balance`, so `npm test` also guards the question files.

const TODAY = "2026-10-15";

describe("repository content", () => {
  const result = validateContent(readContent(TODAY));

  it("has no validation errors", () => {
    expect(result.errors).toEqual([]);
  });

  it("has at least three placeholders in each category a human still has to fill", () => {
    for (const category of ["stefna", "atkvaedi", "folkid", "tolur"]) {
      const placeholders = result.questions.filter((q) => q.category === category && q.status === "placeholder");
      expect(placeholders.length, category).toBeGreaterThanOrEqual(3);
    }
  });

  it("covers the balance-checked parties evenly in flokkarnir", () => {
    const report = computeBalance(result.questions, result.registry!.parties, TODAY);
    expect(report.warnings).toEqual([]);
    const counts = report.checkedParties.map((letter) => report.counts[letter].flokkarnir);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("asks about every registered party's list letter at least once", () => {
    const subjects = new Set(
      result.questions.filter((q) => q.category === "flokkarnir" && q.status === "verified").flatMap((q) => q.parties ?? []),
    );
    const missing = result.registry!.parties.filter((p) => !subjects.has(p.letter)).map((p) => p.letter);
    expect(missing).toEqual([]);
  });
});
