import { describe, expect, it } from "vitest";
import type { Question } from "./schema";
import { makeQuestion, without } from "./test-helpers";
import { validateContent, type ContentInput } from "./validate";

const REGISTRY = {
  sources: [{ title: "Landskjörstjórn", url: "https://island.is/s/landskjorstjorn/althingiskosningar", accessed: "2026-10-15" }],
  parties: [
    { letter: "B", name: "Framsóknarflokkur" },
    { letter: "C", name: "Viðreisn" },
    { letter: "D", name: "Sjálfstæðisflokkur" },
  ],
};

function input(files: Record<string, unknown[]>, overrides: Partial<ContentInput> = {}): ContentInput {
  return {
    questionFiles: Object.entries(files).map(([name, data]) => ({ file: `content/questions/${name}.json`, data })),
    parties: { file: "content/parties.json", data: REGISTRY },
    retiredIds: { file: "content/retired-ids.json", data: [] },
    today: "2026-10-15",
    ...overrides,
  };
}

const ALL_CATEGORIES_EMPTY = { kerfid: [], flokkarnir: [], stefna: [], atkvaedi: [], tolur: [], folkid: [] };

function whoPromised(overrides: Partial<Question> = {}): Question {
  return makeQuestion({
    id: "stefna-0001",
    type: "who_promised",
    category: "stefna",
    prompt: "„Við ætlum að lækka skatta.“ Hver lofaði þessu?",
    options: [
      { id: "B", text: "Framsóknarflokkur" },
      { id: "C", text: "Viðreisn" },
      { id: "D", text: "Sjálfstæðisflokkur" },
    ],
    correctOptionId: "C",
    parties: ["C"],
    ...overrides,
  });
}

describe("validateContent", () => {
  it("accepts a clean content set", () => {
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [makeQuestion()] }));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.questions.map((q) => q.id)).toEqual(["kerfid-0001"]);
  });

  it("reports schema errors with the question id and drops the question", () => {
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [without(makeQuestion(), "reviewedBy")] }));
    expect(result.errors).toEqual([
      expect.objectContaining({ questionId: "kerfid-0001", message: "reviewedBy: verified questions need reviewedBy" }),
    ]);
    expect(result.questions).toEqual([]);
  });

  it("requires each question to live in its category's file", () => {
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, tolur: [makeQuestion()] }));
    expect(result.errors.map((e) => e.message)).toEqual(['category "kerfid" does not match the file it is in']);
  });

  it("rejects unknown file names and non-array files", () => {
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, misc: [] }));
    expect(result.errors).toHaveLength(1);
    const notArray = input(ALL_CATEGORIES_EMPTY);
    notArray.questionFiles[0].data = { questions: [] };
    expect(validateContent(notArray).errors.map((e) => e.message)).toEqual([
      "file must contain a JSON array of questions",
    ]);
  });

  it("warns about missing category files", () => {
    const result = validateContent(input({ kerfid: [] }));
    expect(result.warnings).toHaveLength(5);
  });

  it("rejects duplicate and retired ids", () => {
    const duplicate = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [makeQuestion(), makeQuestion()] }));
    expect(duplicate.errors.map((e) => e.message)).toEqual(["duplicate id (also in content/questions/kerfid.json)"]);

    const retired = validateContent(
      input(
        { ...ALL_CATEGORIES_EMPTY, kerfid: [makeQuestion()] },
        { retiredIds: { file: "content/retired-ids.json", data: ["kerfid-0001"] } },
      ),
    );
    expect(retired.errors).toHaveLength(1);
  });

  it("warns when the id prefix does not match the category", () => {
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [makeQuestion({ id: "tolur-0009" })] }));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  describe("party references", () => {
    it("rejects unknown party letters", () => {
      const q = makeQuestion({ parties: ["Q"] });
      const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [q] }));
      expect(result.errors.map((e) => e.message)).toEqual(['parties: unknown party "Q"']);
    });

    it("allows pseudo-parties only in placeholders", () => {
      const placeholder = without(makeQuestion({ status: "placeholder", sources: [], parties: ["X1"] }), "reviewedBy");
      expect(validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [placeholder] })).errors).toEqual([]);

      const verified = makeQuestion({ parties: ["X1"] });
      expect(validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [verified] })).errors).toHaveLength(1);
    });

    it("requires who_promised options to be registered parties", () => {
      const q = whoPromised({
        options: [
          { id: "B", text: "Framsóknarflokkur" },
          { id: "C", text: "Viðreisn" },
          { id: "nope", text: "Enginn" },
        ],
      });
      const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, stefna: [q] }));
      expect(result.errors.map((e) => e.message)).toEqual(['options: "nope" is not a known party letter']);
    });

    it("warns when a who_promised prompt names one of the parties", () => {
      const q = whoPromised({ prompt: "Viðreisn vill lækka skatta. Hver lofaði þessu?" });
      const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, stefna: [q] }));
      expect(result.errors).toEqual([]);
      expect(result.warnings.map((w) => w.message)).toEqual([
        'prompt mentions "Viðreisn"; who_promised prompts should be anonymised',
      ]);
    });
  });

  it("rejects a broken party registry", () => {
    const result = validateContent(
      input(ALL_CATEGORIES_EMPTY, { parties: { file: "content/parties.json", data: { parties: [] } } }),
    );
    expect(result.registry).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("lists expired questions as needing review", () => {
    const expired = makeQuestion({ validUntil: "2026-10-14" });
    const lastDay = makeQuestion({ id: "kerfid-0002", validUntil: "2026-10-15" });
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [expired, lastDay] }));
    expect(result.expired.map((q) => q.id)).toEqual(["kerfid-0001"]);
    expect(result.warnings).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("lists verified questions awaiting human sign-off", () => {
    const signedOff = makeQuestion({ id: "kerfid-0002", reviewedBy: "Jóna Jónsdóttir" });
    const result = validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [makeQuestion(), signedOff] }));
    expect(result.pendingReview.map((q) => q.id)).toEqual(["kerfid-0001"]);
  });

  it("warns about long explanations", () => {
    const q = makeQuestion({ explanation: "Löng útskýring. ".repeat(30) });
    expect(validateContent(input({ ...ALL_CATEGORIES_EMPTY, kerfid: [q] })).warnings).toHaveLength(1);
  });
});
