import { describe, expect, it } from "vitest";
import { computeBalance } from "./balance";
import type { Party, Question } from "./schema";
import { makeQuestion } from "./test-helpers";

const PARTIES: Party[] = [
  { letter: "B", name: "Framsóknarflokkur" },
  { letter: "C", name: "Viðreisn" },
  { letter: "D", name: "Sjálfstæðisflokkur" },
];
const TODAY = "2026-10-15";

let counter = 0;
function tagged(category: Question["category"], parties: string[], overrides: Partial<Question> = {}): Question {
  counter++;
  return makeQuestion({ id: `${category}-${String(counter).padStart(4, "0")}`, category, parties, ...overrides });
}

describe("computeBalance", () => {
  it("counts active verified questions per party and category", () => {
    const report = computeBalance(
      [
        tagged("flokkarnir", ["B"]),
        tagged("flokkarnir", ["C"]),
        tagged("stefna", ["B", "C"]),
        tagged("kerfid", []),
        tagged("stefna", ["D"], { status: "placeholder" }),
        tagged("stefna", ["D"], { validUntil: "2026-01-01" }),
        tagged("stefna", ["D"], { validFrom: "2027-01-01" }),
      ],
      PARTIES,
      TODAY,
    );
    expect(report.counts.B).toMatchObject({ flokkarnir: 1, stefna: 1 });
    expect(report.counts.C).toMatchObject({ flokkarnir: 1, stefna: 1 });
    expect(report.counts.D).toMatchObject({ flokkarnir: 0, stefna: 0 });
    expect(report.totals).toEqual({ B: 2, C: 2, D: 0 });
    expect(report.questionsPerCategory).toMatchObject({ flokkarnir: 2, stefna: 1, kerfid: 1 });
  });

  it("counts a party once per question even if tagged twice", () => {
    const report = computeBalance([tagged("stefna", ["B", "B"])], PARTIES, TODAY);
    expect(report.counts.B.stefna).toBe(1);
  });

  it("warns when a party is above 1.5× or below 0.5× the average", () => {
    // B: 4, C: 2, D: 0 → average 2. B is 2.0× (warn), C is 1.0×, D is 0× (warn).
    const questions = [
      ...Array.from({ length: 4 }, () => tagged("atkvaedi", ["B"])),
      ...Array.from({ length: 2 }, () => tagged("atkvaedi", ["C"])),
    ];
    const report = computeBalance(questions, PARTIES, TODAY);
    expect(report.warnings.map((w) => [w.category, w.party, w.ratio])).toEqual([
      ["atkvaedi", "B", 2],
      ["atkvaedi", "D", 0],
    ]);
  });

  it("does not warn at exactly 1.5× or 0.5×", () => {
    // B: 3, C: 2, D: 1 → average 2; ratios 1.5, 1.0, 0.5.
    const questions = [
      ...Array.from({ length: 3 }, () => tagged("stefna", ["B"])),
      ...Array.from({ length: 2 }, () => tagged("stefna", ["C"])),
      tagged("stefna", ["D"]),
    ];
    expect(computeBalance(questions, PARTIES, TODAY).warnings).toEqual([]);
  });

  it("only checks stefna, atkvaedi and flokkarnir", () => {
    const report = computeBalance([tagged("folkid", ["B"], { validUntil: "2027-01-01" })], PARTIES, TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.noData).toEqual(["stefna", "atkvaedi", "flokkarnir"]);
  });
});
