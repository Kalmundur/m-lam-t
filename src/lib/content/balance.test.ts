import { describe, expect, it } from "vitest";
import { computeBalance } from "./balance";
import type { Party, Question } from "./schema";
import { makeQuestion } from "./test-helpers";

const PARTIES: Party[] = [
  { letter: "B", name: "Framsóknarflokkur", inAlthingi: true, inBalanceCheck: true },
  { letter: "C", name: "Viðreisn", inAlthingi: true, inBalanceCheck: true },
  { letter: "D", name: "Sjálfstæðisflokkur", inAlthingi: true, inBalanceCheck: true },
];
const UNCHECKED: Party = { letter: "P", name: "Píratar", inAlthingi: false, inBalanceCheck: false };
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

  it("counts parties outside the balance check but leaves them out of averages and warnings", () => {
    // Checked: B 2, C 2, D 2 → average 2, no warnings. P (unchecked) has 6 and 0 elsewhere.
    const questions = [
      ...["B", "C", "D"].flatMap((letter) => [tagged("flokkarnir", [letter]), tagged("flokkarnir", [letter])]),
      ...Array.from({ length: 6 }, () => tagged("flokkarnir", ["P"])),
      tagged("stefna", ["B"]),
      tagged("stefna", ["C"]),
      tagged("stefna", ["D"]),
    ];
    const report = computeBalance(questions, [...PARTIES, UNCHECKED], TODAY);
    expect(report.checkedParties).toEqual(["B", "C", "D"]);
    expect(report.counts.P.flokkarnir).toBe(6);
    expect(report.averages.flokkarnir).toBe(2);
    expect(report.warnings).toEqual([]);
  });

  it("checks nothing when no party is in the balance check", () => {
    const report = computeBalance([tagged("stefna", ["P"])], [UNCHECKED], TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.noData).toEqual(["stefna", "atkvaedi", "flokkarnir"]);
  });

  it("only checks stefna, atkvaedi and flokkarnir", () => {
    const report = computeBalance([tagged("folkid", ["B"], { validUntil: "2027-01-01" })], PARTIES, TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.noData).toEqual(["stefna", "atkvaedi", "flokkarnir"]);
  });
});
