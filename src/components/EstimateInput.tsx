"use client";

import { useId, useState } from "react";
import { estimateStep } from "@/lib/content/constants";
import type { Estimate } from "@/lib/content/schema";
import { formatNumber } from "@/lib/format";
import { is } from "@/i18n/is";

/** Rounds to the slider grid, without floating-point noise like 0.30000000000000004. */
export function snapToStep(value: number, estimate: Estimate): number {
  const step = estimateStep(estimate);
  const snapped = estimate.min + Math.round((value - estimate.min) / step) * step;
  return Number(Math.min(estimate.max, Math.max(estimate.min, snapped)).toFixed(10));
}

/** Where the slider starts: the middle of the range. */
export function initialGuess(estimate: Estimate): number {
  return snapToStep((estimate.min + estimate.max) / 2, estimate);
}

type Props = {
  estimate: Estimate;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  /** id of the question prompt, read out with the slider. */
  describedBy: string;
};

/** A slider plus a text box for the same number, so it works by touch, keyboard and screen reader. */
export function EstimateInput({ estimate, value, onChange, disabled, describedBy }: Props) {
  const sliderId = useId();
  const [draft, setDraft] = useState(() => formatNumber(value).replace(/\./g, ""));
  const unit = estimate.unit ? ` ${estimate.unit}` : "";
  const valueText = `${formatNumber(value)}${unit}`;

  function fromSlider(next: number) {
    onChange(next);
    setDraft(formatNumber(next).replace(/\./g, ""));
  }

  function fromText(text: string) {
    setDraft(text);
    // Accept Icelandic input: "1.234,5" or "1234,5" as well as "1234.5".
    const normalized = text.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (normalized !== "" && Number.isFinite(parsed) && parsed >= estimate.min && parsed <= estimate.max) {
      onChange(snapToStep(parsed, estimate));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={sliderId} className="font-medium">
          {is.question.estimateLabel}
        </label>
        <output htmlFor={sliderId} className="text-2xl font-semibold tabular-nums">
          {valueText}
        </output>
      </div>
      <input
        id={sliderId}
        type="range"
        min={estimate.min}
        max={estimate.max}
        step={estimateStep(estimate)}
        value={value}
        disabled={disabled}
        onChange={(e) => fromSlider(Number(e.target.value))}
        aria-valuetext={valueText}
        aria-describedby={describedBy}
        className="h-8 w-full cursor-pointer accent-brand disabled:cursor-default"
      />
      <div className="flex justify-between text-sm text-ink-muted" aria-hidden="true">
        <span>{formatNumber(estimate.min)}</span>
        <span>{formatNumber(estimate.max)}</span>
      </div>
      <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>{is.question.estimateNumberLabel}</span>
        <span className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={draft}
            disabled={disabled}
            onChange={(e) => fromText(e.target.value)}
            onBlur={() => setDraft(formatNumber(value).replace(/\./g, ""))}
            aria-describedby={`${sliderId}-range`}
            className="w-28 rounded-lg border border-line bg-card px-3 py-2 text-base tabular-nums"
          />
          {estimate.unit && <span>{estimate.unit}</span>}
        </span>
        <span id={`${sliderId}-range`} className="w-full text-ink-muted">
          {is.question.estimateRange(formatNumber(estimate.min), formatNumber(estimate.max))}
        </span>
      </label>
    </div>
  );
}
