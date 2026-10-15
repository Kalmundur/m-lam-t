import { describe, expect, it } from "vitest";
import { icelandToday, isActive, isExpired, isNotYetValid, isPlayable } from "./availability";
import { makeQuestion } from "./test-helpers";

describe("icelandToday", () => {
  it("uses the Icelandic calendar date (UTC+0, no daylight saving)", () => {
    expect(icelandToday(new Date("2026-10-15T23:59:59Z"))).toBe("2026-10-15");
    expect(icelandToday(new Date("2026-10-16T00:00:00Z"))).toBe("2026-10-16");
    expect(icelandToday(new Date("2026-07-01T00:30:00+02:00"))).toBe("2026-06-30");
  });
});

describe("validity window", () => {
  it("treats validFrom and validUntil as inclusive", () => {
    const q = { validFrom: "2026-10-01", validUntil: "2026-10-31" };
    expect(isActive(q, "2026-09-30")).toBe(false);
    expect(isActive(q, "2026-10-01")).toBe(true);
    expect(isActive(q, "2026-10-31")).toBe(true);
    expect(isActive(q, "2026-11-01")).toBe(false);
    expect(isNotYetValid(q, "2026-09-30")).toBe(true);
    expect(isExpired(q, "2026-11-01")).toBe(true);
  });

  it("treats missing dates as open-ended", () => {
    expect(isActive({}, "1999-01-01")).toBe(true);
    expect(isActive({}, "2999-01-01")).toBe(true);
  });
});

describe("isPlayable", () => {
  const today = "2026-10-15";
  const verified = makeQuestion();
  const placeholder = makeQuestion({ status: "placeholder", sources: [] });

  it("hides placeholders unless explicitly enabled", () => {
    expect(isPlayable(verified, { today, showPlaceholders: false })).toBe(true);
    expect(isPlayable(placeholder, { today, showPlaceholders: false })).toBe(false);
    expect(isPlayable(placeholder, { today, showPlaceholders: true })).toBe(true);
  });

  it("hides expired and not-yet-valid questions", () => {
    expect(isPlayable(makeQuestion({ validUntil: "2026-10-14" }), { today, showPlaceholders: false })).toBe(false);
    expect(isPlayable(makeQuestion({ validFrom: "2026-10-16" }), { today, showPlaceholders: true })).toBe(false);
  });
});
