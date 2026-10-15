import { describe, expect, it } from "vitest";
import {
  HISTORY_DAYS_KEPT,
  addAnswer,
  finishRecord,
  newDailyRecord,
  parseDailyHistory,
  serializeDailyHistory,
} from "./progress";
import type { ScoredAnswer } from "./scoring";

const answer: ScoredAnswer = { questionId: "kerfid-0001", category: "kerfid", response: "b", outcome: "correct" };

describe("daily progress", () => {
  it("round-trips through storage", () => {
    const record = finishRecord(addAnswer(newDailyRecord("2026-10-15", ["kerfid-0001"]), answer));
    const history = parseDailyHistory(serializeDailyHistory({ "2026-10-15": record }));
    expect(history).toEqual({ "2026-10-15": record });
  });

  it("returns an empty history for missing or corrupt data", () => {
    expect(parseDailyHistory(null)).toEqual({});
    expect(parseDailyHistory(undefined)).toEqual({});
    expect(parseDailyHistory("not json")).toEqual({});
    expect(parseDailyHistory("[1,2]")).toEqual({});
  });

  it("drops malformed records but keeps good ones", () => {
    const good = newDailyRecord("2026-10-15", ["kerfid-0001"]);
    const raw = JSON.stringify({
      "2026-10-15": good,
      "2026-10-16": { date: "2026-10-16", questionIds: "nope", answers: [], finished: false },
      "2026-10-17": { ...good, date: "2026-10-17", answers: [{ ...answer, outcome: "great" }] },
      "not-a-date": good,
    });
    expect(Object.keys(parseDailyHistory(raw))).toEqual(["2026-10-15"]);
  });

  it("ignores a second answer to the same question", () => {
    const record = addAnswer(addAnswer(newDailyRecord("2026-10-15", ["kerfid-0001"]), answer), {
      ...answer,
      response: "a",
      outcome: "wrong",
    });
    expect(record.answers).toEqual([answer]);
  });

  it("keeps only the most recent days", () => {
    const history = Object.fromEntries(
      Array.from({ length: HISTORY_DAYS_KEPT + 5 }, (_, i) => {
        const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
        return [date, newDailyRecord(date, [])];
      }),
    );
    const kept = Object.keys(parseDailyHistory(serializeDailyHistory(history)));
    expect(kept).toHaveLength(HISTORY_DAYS_KEPT);
    expect(kept[0]).toBe("2025-01-06");
  });
});
