import { describe, expect, it } from "vitest";
import { isPlayable } from "../src/lib/content/availability";
import { filterForRelease, getQuestionBank } from "../src/lib/content/bank";
import { validateContent } from "../src/lib/content/validate";
import { readContent } from "./lib/content-files";

// Placeholder filtering, end to end on the real content.

const TODAY = "2026-10-15";
const all = validateContent(readContent(TODAY)).questions;

describe("question bank", () => {
  it("leaves placeholders out of a release build", () => {
    const bank = filterForRelease(all, false);
    expect(bank.length).toBeGreaterThan(0);
    expect(bank.every((q) => q.status === "verified")).toBe(true);
    // The app's default build uses the same rule (NEXT_PUBLIC_SHOW_PLACEHOLDERS is unset in tests).
    const ids = (questions: { id: string }[]) => questions.map((q) => q.id).sort();
    expect(ids(getQuestionBank())).toEqual(ids(bank));
  });

  it("includes placeholders only when they are switched on", () => {
    const preview = filterForRelease(all, true);
    expect(preview.some((q) => q.status === "placeholder")).toBe(true);
    expect(preview).toHaveLength(all.length);
  });

  it("also filters placeholders at play time", () => {
    const placeholder = all.find((q) => q.status === "placeholder")!;
    expect(isPlayable(placeholder, { today: TODAY, showPlaceholders: false })).toBe(false);
    expect(isPlayable(placeholder, { today: TODAY, showPlaceholders: true })).toBe(true);
  });
});
