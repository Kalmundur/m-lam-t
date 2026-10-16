import { describe, expect, it } from "vitest";
import { finishRecord, newDailyRecord, type DailyHistory, type DailyRecord } from "./progress";
import type { ScoredAnswer } from "./scoring";
import { shareText } from "./share";
import { currentStreak } from "./streak";
import { isStorageAvailable } from "../storage";

function done(date: string): DailyRecord {
  return finishRecord(newDailyRecord(date, ["kerfid-0001"]));
}
function history(...records: DailyRecord[]): DailyHistory {
  return Object.fromEntries(records.map((r) => [r.date, r]));
}

describe("currentStreak", () => {
  it("counts consecutive completed days up to today", () => {
    expect(currentStreak(history(done("2026-10-14"), done("2026-10-15"), done("2026-10-16")), "2026-10-16")).toBe(3);
  });

  it("keeps yesterday's streak alive while today's quiz isn't done", () => {
    const h = history(done("2026-10-14"), done("2026-10-15"), newDailyRecord("2026-10-16", ["kerfid-0001"]));
    expect(currentStreak(h, "2026-10-16")).toBe(2);
    expect(currentStreak(history(done("2026-10-15")), "2026-10-16")).toBe(1);
  });

  it("is broken by a missed day", () => {
    expect(currentStreak(history(done("2026-10-13"), done("2026-10-15")), "2026-10-15")).toBe(1);
    expect(currentStreak(history(done("2026-10-13")), "2026-10-16")).toBe(0);
    expect(currentStreak({}, "2026-10-16")).toBe(0);
  });

  it("counts a fully answered quiz even if results were never opened", () => {
    const answered: DailyRecord = {
      ...newDailyRecord("2026-10-16", ["kerfid-0001"]),
      answers: [{ questionId: "kerfid-0001", category: "kerfid", response: "b", outcome: "correct" }],
    };
    expect(currentStreak(history(answered), "2026-10-16")).toBe(1);
  });

  it("crosses month and year boundaries", () => {
    expect(currentStreak(history(done("2026-12-31"), done("2027-01-01")), "2027-01-01")).toBe(2);
  });
});

describe("shareText", () => {
  const answer = (id: string, outcome: ScoredAnswer["outcome"]): ScoredAnswer => ({
    questionId: id,
    category: "kerfid",
    response: "a",
    outcome,
  });

  it("matches the Wordle-style format without giving answers away", () => {
    const record: DailyRecord = {
      date: "2026-10-15",
      questionIds: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
      answers: [
        answer("q1", "correct"),
        answer("q2", "correct"),
        answer("q3", "wrong"),
        answer("q4", "correct"),
        answer("q5", "correct"),
        answer("q6", "wrong"),
        answer("q7", "correct"),
      ],
      finished: true,
    };
    expect(shareText(record)).toBe("Málamót 15.10. 5/7 🟩🟩🟥🟩🟩🟥🟩");
    expect(shareText(record, "https://example.is")).toBe("Málamót 15.10. 5/7 🟩🟩🟥🟩🟩🟥🟩\nhttps://example.is");
  });

  it("orders squares by the quiz order, not the answer order", () => {
    const record: DailyRecord = {
      date: "2026-01-05",
      questionIds: ["q1", "q2"],
      answers: [answer("q2", "wrong"), answer("q1", "correct")],
      finished: true,
    };
    expect(shareText(record)).toBe("Málamót 5.1. 1/2 🟩🟥");
  });
});

describe("isStorageAvailable", () => {
  it("reports false where there is no localStorage, without throwing", () => {
    expect(isStorageAvailable()).toBe(false);
  });
});
