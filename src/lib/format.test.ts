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
    expect(formatNumber(1000)).toBe("1.000");
    expect(formatNumber(1234567.25)).toBe("1.234.567,25");
    expect(formatNumber(-1500)).toBe("-1.500");
    expect(formatNumber(0.1 + 0.2)).toBe("0,3");
  });

  it("covers every weekday and month", () => {
    const days = Array.from({ length: 7 }, (_, i) => formatLongDate(`2026-10-${String(11 + i).padStart(2, "0")}`));
    expect(days.map((d) => d.split(" ")[0])).toEqual([
      "sunnudagur",
      "mánudagur",
      "þriðjudagur",
      "miðvikudagur",
      "fimmtudagur",
      "föstudagur",
      "laugardagur",
    ]);
    expect(formatLongDate("2026-12-31")).toBe("fimmtudagur 31. desember");
  });
});

describe("reportErrorHref", () => {
  it("builds a mailto link that names the question", () => {
    const href = reportErrorHref("kerfid-0001");
    expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=/);
    expect(decodeURIComponent(href)).toContain("kerfid-0001");
  });
});
