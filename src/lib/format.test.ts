import { describe, expect, it } from "vitest";
import { formatLongDate, formatNumber, formatShortDate } from "./format";
import { reportErrorHref } from "./report-error";

describe("Icelandic formatting", () => {
  it("formats dates", () => {
    expect(formatLongDate("2026-10-15")).toBe("fimmtudagur 15. október");
    expect(formatLongDate("2027-01-01")).toBe("föstudagur 1. janúar");
    expect(formatShortDate("2026-10-15")).toBe("15.10.");
    expect(formatShortDate("2026-01-05")).toBe("5.1.");
  });

  it("formats numbers with Icelandic separators", () => {
    expect(formatNumber(63)).toBe("63");
    expect(formatNumber(5.5)).toBe("5,5");
    expect(formatNumber(1234567)).toBe("1.234.567");
  });
});

describe("reportErrorHref", () => {
  it("builds a mailto link that names the question", () => {
    const href = reportErrorHref("kerfid-0001");
    expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=/);
    expect(decodeURIComponent(href)).toContain("kerfid-0001");
  });
});
