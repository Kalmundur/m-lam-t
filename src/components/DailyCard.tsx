"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatLongDate, formatNumber } from "@/lib/format";
import { useIcelandToday, useStoredValue } from "@/lib/hooks";
import { DAILY_STORAGE_KEY, parseDailyHistory } from "@/lib/quiz/progress";
import { summarize } from "@/lib/quiz/scoring";
import { is } from "@/i18n/is";

/** The daily quiz on the home page: start it, continue it, or see today's result. */
export function DailyCard() {
  const today = useIcelandToday();
  const raw = useStoredValue(DAILY_STORAGE_KEY);
  const record = useMemo(
    () => (today && raw !== undefined ? parseDailyHistory(raw)[today] : undefined),
    [today, raw],
  );
  const total = record?.questionIds.length ?? 0;
  const answered = record?.answers.length ?? 0;
  const finished = record !== undefined && (record.finished || (total > 0 && answered >= total));

  return (
    <section className="card flex flex-col gap-3" aria-labelledby="daily-title">
      <div>
        <h2 id="daily-title" className="text-xl font-semibold">
          {is.home.dailyTitle}
        </h2>
        {/* The date depends on the visitor's clock, so it only appears once the page runs in the browser. */}
        <p className="min-h-6 text-ink-muted">{today ? formatLongDate(today) : ""}</p>
      </div>
      {finished ? (
        <>
          <p>{is.home.dailyDone(formatNumber(summarize(record.answers).points), total)}</p>
          <Link href="/dagsins" className="button-secondary">
            {is.home.seeResults}
          </Link>
        </>
      ) : (
        <>
          <p className="text-ink-muted">{is.home.dailyHint}</p>
          <Link href="/dagsins" className="button-primary">
            {answered > 0 ? is.home.continueDaily(answered, total) : is.home.takeDaily}
          </Link>
        </>
      )}
    </section>
  );
}
