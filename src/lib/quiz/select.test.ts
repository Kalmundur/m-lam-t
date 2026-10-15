import { describe, expect, it } from "vitest";
import type { Question } from "../content/schema";
import { makeQuestion } from "../content/test-helpers";
import { createRng, hashString, rngFor, shuffle } from "./random";
import {
  arrangeDailyOptions,
  arrangeOptions,
  dailyQuestionIds,
  pickQuestions,
  practiceQuestions,
} from "./select";

function pool(size: number, parties: (i: number) => string[] | undefined = () => undefined): Question[] {
  return Array.from({ length: size }, (_, i) =>
    makeQuestion({ id: `kerfid-${String(i + 1).padStart(4, "0")}`, parties: parties(i) }),
  );
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("random", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(hashString("daily:2026-10-15")).toBe(hashString("daily:2026-10-15"));
    expect(hashString("daily:2026-10-15")).not.toBe(hashString("daily:2026-10-16"));
  });

  it("shuffles into a permutation without changing the input", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffle(items, rngFor("x"));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("daily quiz seeding", () => {
  const questions = pool(34);

  it("gives the same questions for the same date", () => {
    expect(dailyQuestionIds(questions, "2026-10-15")).toEqual(dailyQuestionIds(questions, "2026-10-15"));
  });

  it("does not depend on the order of the pool", () => {
    expect(dailyQuestionIds([...questions].reverse(), "2026-10-15")).toEqual(
      dailyQuestionIds(questions, "2026-10-15"),
    );
  });

  it("gives different questions on different dates", () => {
    const dates = Array.from({ length: 60 }, (_, i) => addDays("2026-10-01", i));
    const sets = dates.map((d) => dailyQuestionIds(questions, d).join());
    for (let i = 1; i < sets.length; i++) expect(sets[i]).not.toBe(sets[i - 1]);
    expect(new Set(sets).size).toBe(sets.length);
  });

  it("picks seven distinct questions, or the whole pool if it is smaller", () => {
    const ids = dailyQuestionIds(questions, "2026-10-15");
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
    expect(dailyQuestionIds(pool(4), "2026-10-15")).toHaveLength(4);
    expect(dailyQuestionIds([], "2026-10-15")).toEqual([]);
  });

  it("keeps the option order stable for a question on a given day", () => {
    const q = makeQuestion({
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
        { id: "c", text: "C" },
        { id: "d", text: "D" },
      ],
    });
    expect(arrangeDailyOptions(q, "2026-10-15").options).toEqual(arrangeDailyOptions(q, "2026-10-15").options);
  });
});

describe("pickQuestions", () => {
  it("avoids two questions about the same party when it can", () => {
    // 20 questions over 10 parties (two each) plus 10 untagged: 7 party-distinct picks are always possible.
    const questions = pool(30, (i) => (i < 20 ? [`P${i % 10}`] : undefined));
    for (let seed = 0; seed < 200; seed++) {
      const picked = pickQuestions(questions, 7, createRng(seed));
      const parties = picked.flatMap((q) => q.parties ?? []);
      expect(new Set(parties).size).toBe(parties.length);
    }
  });

  it("treats a question tagged with several parties as clashing with each of them", () => {
    const questions = [
      makeQuestion({ id: "stefna-0001", parties: ["B", "C"] }),
      makeQuestion({ id: "stefna-0002", parties: ["C"] }),
      makeQuestion({ id: "stefna-0003", parties: ["D"] }),
    ];
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickQuestions(questions, 2, createRng(seed)).map((q) => q.id);
      expect(picked).not.toEqual(expect.arrayContaining(["stefna-0001", "stefna-0002"]));
    }
  });

  it("fills up with same-party questions when there is no other way", () => {
    const questions = pool(5, () => ["S"]);
    const picked = pickQuestions(questions, 3, createRng(1));
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((q) => q.id)).size).toBe(3);
  });
});

describe("option order", () => {
  const options = [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
    { id: "d", text: "D" },
  ];

  it("shuffles choice options", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        arrangeOptions(makeQuestion({ options }), createRng(seed))
          .options!.map((o) => o.id)
          .join(""),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("keeps true/false and keepOptionOrder questions in file order", () => {
    const tf = makeQuestion({
      type: "true_false",
      options: [
        { id: "true", text: "Satt" },
        { id: "false", text: "Ósatt" },
      ],
      correctOptionId: "true",
    });
    const ordered = makeQuestion({ options, keepOptionOrder: true });
    for (let seed = 0; seed < 20; seed++) {
      expect(arrangeOptions(tf, createRng(seed)).options!.map((o) => o.id)).toEqual(["true", "false"]);
      expect(arrangeOptions(ordered, createRng(seed)).options!.map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
    }
  });
});

describe("practiceQuestions", () => {
  it("gives up to ten questions and varies with the seed", () => {
    const questions = pool(19);
    expect(practiceQuestions(questions, 1)).toHaveLength(10);
    expect(practiceQuestions(pool(6), 1)).toHaveLength(6);
    expect(practiceQuestions(questions, 1).map((q) => q.id)).not.toEqual(
      practiceQuestions(questions, 2).map((q) => q.id),
    );
  });
});
