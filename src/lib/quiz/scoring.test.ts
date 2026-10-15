import { describe, expect, it } from "vitest";
import type { Question } from "../content/schema";
import { makeQuestion, without } from "../content/test-helpers";
import { answerQuestion, scoreAnswer, summarize, type ScoredAnswer } from "./scoring";

function estimate(e: Partial<NonNullable<Question["estimate"]>> = {}): Question {
  return {
    ...(without(makeQuestion({ type: "estimate" }), "options", "correctOptionId") as Question),
    estimate: { answer: 100, min: 0, max: 200, unit: "", ...e },
  };
}

describe("scoreAnswer", () => {
  it("scores multiple_choice by option id", () => {
    const q = makeQuestion();
    expect(scoreAnswer(q, "b")).toBe("correct");
    expect(scoreAnswer(q, "a")).toBe("wrong");
  });

  it("scores true_false", () => {
    const q = makeQuestion({
      type: "true_false",
      options: [
        { id: "true", text: "Satt" },
        { id: "false", text: "Ósatt" },
      ],
      correctOptionId: "false",
    });
    expect(scoreAnswer(q, "false")).toBe("correct");
    expect(scoreAnswer(q, "true")).toBe("wrong");
  });

  it("scores who_promised by party letter", () => {
    const q = makeQuestion({
      type: "who_promised",
      options: [
        { id: "B", text: "Framsóknarflokkur" },
        { id: "C", text: "Viðreisn" },
        { id: "D", text: "Sjálfstæðisflokkur" },
      ],
      correctOptionId: "C",
      parties: ["C"],
    });
    expect(scoreAnswer(q, "C")).toBe("correct");
    expect(scoreAnswer(q, "D")).toBe("wrong");
  });

  it("scores vote_record by outcome", () => {
    const q = makeQuestion({
      type: "vote_record",
      options: [
        { id: "samthykkt", text: "Samþykkt" },
        { id: "fellt", text: "Fellt" },
      ],
      correctOptionId: "samthykkt",
    });
    expect(scoreAnswer(q, "samthykkt")).toBe("correct");
    expect(scoreAnswer(q, "fellt")).toBe("wrong");
  });

  it("treats a number for a choice question, or text for an estimate, as wrong", () => {
    expect(scoreAnswer(makeQuestion(), 2)).toBe("wrong");
    expect(scoreAnswer(estimate(), "100")).toBe("wrong");
    expect(scoreAnswer(estimate(), Number.NaN)).toBe("wrong");
  });

  describe("estimate", () => {
    it("gives full points within ±10% and partial within ±25% by default", () => {
      const q = estimate();
      expect(scoreAnswer(q, 100)).toBe("correct");
      expect(scoreAnswer(q, 110)).toBe("correct");
      expect(scoreAnswer(q, 90)).toBe("correct");
      expect(scoreAnswer(q, 111)).toBe("partial");
      expect(scoreAnswer(q, 75)).toBe("partial");
      expect(scoreAnswer(q, 125)).toBe("partial");
      expect(scoreAnswer(q, 126)).toBe("wrong");
      expect(scoreAnswer(q, 0)).toBe("wrong");
    });

    it("uses per-question tolerances", () => {
      // The seat-count question: exact for full points, ±10% for partial.
      const seats = estimate({ answer: 63, min: 20, max: 120, fullTolerance: 0, partialTolerance: 0.1 });
      expect(scoreAnswer(seats, 63)).toBe("correct");
      expect(scoreAnswer(seats, 64)).toBe("partial");
      expect(scoreAnswer(seats, 69)).toBe("partial");
      expect(scoreAnswer(seats, 70)).toBe("wrong");
      expect(scoreAnswer(seats, 57)).toBe("partial");
      expect(scoreAnswer(seats, 56)).toBe("wrong");
    });

    it("is not thrown off by floating-point error at the boundary", () => {
      // 63 × 1.1 = 69.30000000000001 in floating point.
      const q = estimate({ answer: 63, min: 0, max: 200, step: 0.1, fullTolerance: 0.1 });
      expect(scoreAnswer(q, 69.3)).toBe("correct");
    });

    it("handles negative answers", () => {
      const q = estimate({ answer: -50, min: -100, max: 0 });
      expect(scoreAnswer(q, -55)).toBe("correct");
      expect(scoreAnswer(q, -60)).toBe("partial");
      expect(scoreAnswer(q, -10)).toBe("wrong");
    });
  });
});

describe("summarize", () => {
  const a = (category: ScoredAnswer["category"], outcome: ScoredAnswer["outcome"]): ScoredAnswer => ({
    questionId: `${category}-x`,
    category,
    response: "a",
    outcome,
  });

  it("adds up points, with half a point for partial estimates", () => {
    const summary = summarize([a("kerfid", "correct"), a("kerfid", "partial"), a("flokkarnir", "wrong")]);
    expect(summary.points).toBe(1.5);
    expect(summary.max).toBe(3);
    expect(summary.byCategory).toEqual([
      { category: "kerfid", points: 1.5, max: 2 },
      { category: "flokkarnir", points: 0, max: 1 },
    ]);
  });

  it("names the strongest and weakest category when they differ", () => {
    const summary = summarize([a("flokkarnir", "correct"), a("kerfid", "wrong"), a("kerfid", "correct")]);
    expect(summary.strongest).toBe("flokkarnir");
    expect(summary.weakest).toBe("kerfid");
  });

  it("names neither when all categories did equally well, or there is only one", () => {
    expect(summarize([a("kerfid", "correct"), a("flokkarnir", "correct")]).strongest).toBeUndefined();
    expect(summarize([a("kerfid", "correct"), a("kerfid", "wrong")]).weakest).toBeUndefined();
    expect(summarize([])).toEqual({ points: 0, max: 0, byCategory: [] });
  });

  it("builds a stored answer from a question and response", () => {
    expect(answerQuestion(makeQuestion(), "b")).toEqual({
      questionId: "kerfid-0001",
      category: "kerfid",
      response: "b",
      outcome: "correct",
    });
  });
});
