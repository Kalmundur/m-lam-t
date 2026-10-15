import { describe, expect, it } from "vitest";
import { QuestionSchema } from "./schema";
import { makeQuestion, without } from "./test-helpers";

function messages(input: unknown): string[] {
  const result = QuestionSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

const TF_OPTIONS = [
  { id: "true", text: "Satt" },
  { id: "false", text: "Ósatt" },
];
const PARTY_OPTIONS = [
  { id: "B", text: "Framsóknarflokkur" },
  { id: "C", text: "Viðreisn" },
  { id: "D", text: "Sjálfstæðisflokkur" },
];

describe("QuestionSchema", () => {
  it("accepts a complete verified question", () => {
    expect(messages(makeQuestion())).toEqual([]);
  });

  it("rejects unknown fields", () => {
    expect(messages({ ...makeQuestion(), answer: "b" })).toHaveLength(1);
  });

  describe("verified questions", () => {
    it("need at least one source", () => {
      expect(messages(makeQuestion({ sources: [] }))).toEqual([
        "sources: verified questions need at least one source",
      ]);
    });

    it("need reviewedBy", () => {
      expect(messages(without(makeQuestion(), "reviewedBy"))).toEqual(["reviewedBy: verified questions need reviewedBy"]);
    });

    it("need a non-empty explanation", () => {
      expect(messages(makeQuestion({ explanation: "   " }))).not.toEqual([]);
    });

    it("in folkid need validUntil", () => {
      expect(messages(makeQuestion({ id: "folkid-0001", category: "folkid" }))).toEqual([
        'validUntil: verified "folkid" questions need validUntil, because the facts change',
      ]);
      expect(messages(makeQuestion({ id: "folkid-0001", category: "folkid", validUntil: "2027-01-01" }))).toEqual([]);
    });
  });

  it("allows placeholders without sources or reviewer", () => {
    const q = without(makeQuestion({ status: "placeholder", sources: [] }), "reviewedBy");
    expect(messages(q)).toEqual([]);
  });

  it("requires sources to be http(s) links with ISO access dates", () => {
    const bad = makeQuestion({ sources: [{ title: "x", url: "ftp://example.is", accessed: "15.10.2026" }] });
    expect(messages(bad)).toHaveLength(2);
  });

  it("rejects validFrom after validUntil", () => {
    expect(messages(makeQuestion({ validFrom: "2027-01-02", validUntil: "2027-01-01" }))).toEqual([
      "validUntil: validUntil must not be before validFrom",
    ]);
  });

  describe("options", () => {
    it("requires correctOptionId to be one of the options", () => {
      expect(messages(makeQuestion({ correctOptionId: "z" }))).toEqual([
        'correctOptionId: correctOptionId "z" is not one of the option ids',
      ]);
    });

    it("requires unique option ids and texts", () => {
      const options = [
        { id: "a", text: "Sex" },
        { id: "a", text: "sex" },
        { id: "c", text: "Átta" },
      ];
      expect(messages(makeQuestion({ options, correctOptionId: "a" }))).toEqual([
        "options: option ids must be unique",
        "options: option texts must be unique",
      ]);
    });

    it("limits multiple_choice to 3–4 options", () => {
      const two = makeQuestion().options!.slice(0, 2);
      expect(messages(makeQuestion({ options: two }))).toHaveLength(1);
      const five = [...makeQuestion().options!, { id: "d", text: "Tíu" }, { id: "e", text: "Tólf" }];
      expect(messages(makeQuestion({ options: five }))).toHaveLength(1);
    });

    it("requires true_false to use the fixed true/false ids", () => {
      expect(messages(makeQuestion({ type: "true_false", options: TF_OPTIONS, correctOptionId: "false" }))).toEqual([]);
      const wrong = [
        { id: "yes", text: "Satt" },
        { id: "no", text: "Ósatt" },
      ];
      expect(messages(makeQuestion({ type: "true_false", options: wrong, correctOptionId: "no" }))).toHaveLength(1);
    });

    it("requires who_promised to offer the correct party plus at least two others", () => {
      const ok = makeQuestion({ type: "who_promised", options: PARTY_OPTIONS, correctOptionId: "C", parties: ["C"] });
      expect(messages(ok)).toEqual([]);
      expect(messages({ ...ok, options: PARTY_OPTIONS.slice(0, 2) })).toHaveLength(1);
    });

    it("requires who_promised to be tagged with the correct party", () => {
      const q = makeQuestion({ type: "who_promised", options: PARTY_OPTIONS, correctOptionId: "C", parties: ["B"] });
      expect(messages(q)).toEqual(["parties: who_promised questions must list the correct party in parties"]);
    });

    it("allows vote_record with two outcomes", () => {
      const options = [
        { id: "samthykkt", text: "Samþykkt" },
        { id: "fellt", text: "Fellt" },
      ];
      expect(messages(makeQuestion({ type: "vote_record", options, correctOptionId: "fellt" }))).toEqual([]);
    });
  });

  describe("estimate", () => {
    const estimateQuestion = (estimate: object) => ({
      ...without(makeQuestion({ type: "estimate" }), "options", "correctOptionId"),
      estimate,
    });

    it("accepts an estimate with default tolerances", () => {
      expect(messages(estimateQuestion({ answer: 63, min: 20, max: 120, unit: "þingsæti" }))).toEqual([]);
    });

    it("requires the estimate block and forbids options", () => {
      expect(messages(makeQuestion({ type: "estimate" }))).toEqual([
        "estimate: estimate questions need an estimate block",
        "options: estimate questions must not have options",
        "correctOptionId: estimate questions must not have correctOptionId",
      ]);
    });

    it("checks the range and tolerances", () => {
      expect(messages(estimateQuestion({ answer: 200, min: 20, max: 120, unit: "" }))).toEqual([
        "estimate.answer: answer must lie between min and max",
      ]);
      expect(messages(estimateQuestion({ answer: 50, min: 100, max: 20, unit: "" }))).toContain(
        "estimate.max: max must be greater than min",
      );
      expect(messages(estimateQuestion({ answer: 63, min: 20, max: 120, unit: "", fullTolerance: 0.3 }))).toEqual([]);
      expect(messages(estimateQuestion({ answer: 63, min: 20, max: 120, unit: "", fullTolerance: 1.5 }))).toHaveLength(1);
    });

    it("rejects partialTolerance, since estimates score full or nothing", () => {
      expect(
        messages(estimateQuestion({ answer: 63, min: 20, max: 120, unit: "", fullTolerance: 0, partialTolerance: 0.1 })),
      ).toEqual([expect.stringMatching(/Unrecognized key: "partialTolerance"/)]);
    });

    it("rejects an answer of 0, since tolerances are relative", () => {
      expect(messages(estimateQuestion({ answer: 0, min: -10, max: 10, unit: "" }))).toHaveLength(1);
    });

    it("requires the answer to be reachable on the slider", () => {
      expect(messages(estimateQuestion({ answer: 63, min: 20, max: 120, unit: "", step: 2 }))).toEqual([
        "estimate.answer: answer is not reachable on the slider (min 20, step 2)",
      ]);
      // 0–3000 gets a default step of 10.
      expect(messages(estimateQuestion({ answer: 1005, min: 0, max: 3000, unit: "" }))).toHaveLength(1);
      expect(messages(estimateQuestion({ answer: 1000, min: 0, max: 3000, unit: "" }))).toEqual([]);
    });

    it("rejects keepOptionOrder, since there are no options", () => {
      const q = { ...estimateQuestion({ answer: 63, min: 20, max: 120, unit: "" }), keepOptionOrder: true };
      expect(messages(q)).toEqual(["keepOptionOrder: estimate questions have no options to order"]);
    });
  });
});
