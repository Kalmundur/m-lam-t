"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Question } from "@/lib/content/schema";
import { formatNumber } from "@/lib/format";
import { correctAnswerText, responseText } from "@/lib/quiz/answer-text";
import { summarize, type Outcome, type ScoredAnswer } from "@/lib/quiz/scoring";
import { reportErrorHref } from "@/lib/report-error";
import { is } from "@/i18n/is";
import { SourceList } from "./SourceList";

const OUTCOME_STYLE: Record<Outcome, { icon: string; className: string }> = {
  correct: { icon: "✓", className: "bg-good-soft text-good" },
  partial: { icon: "≈", className: "bg-near-soft text-near" },
  wrong: { icon: "✗", className: "bg-bad-soft text-bad" },
};

type Props = {
  title: string;
  subtitle?: string;
  questions: Question[];
  answers: ScoredAnswer[];
  /** Buttons and links under the score. */
  actions: ReactNode;
  /** Move focus to the result heading (when arriving from the last question). */
  focusOnMount?: boolean;
};

/** Score, a breakdown by category, and a review of every answer with explanations and sources. */
export function ResultView({ title, subtitle, questions, answers, actions, focusOnMount = false }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summary = summarize(answers);
  const ratio = summary.max ? summary.points / summary.max : 0;
  const byId = new Map(questions.map((q) => [q.id, q]));

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col items-center gap-2 text-center">
        <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        <p className="text-5xl font-bold tabular-nums" data-testid="score">
          {formatNumber(summary.points)}
          <span className="text-2xl font-semibold text-ink-muted">{is.result.outOf(summary.max)}</span>
        </p>
        <p className="text-lg">{is.result.headline(ratio)}</p>
        {summary.strongest && summary.weakest && (
          <p className="text-ink-muted">
            {is.result.strongest} <strong className="text-ink">{is.categories[summary.strongest].name}</strong>
            <br />
            {is.result.weakest} <strong className="text-ink">{is.categories[summary.weakest].name}</strong>
          </p>
        )}
      </section>

      {summary.byCategory.length > 1 && (
        <section className="card flex flex-col gap-3">
          <h2 className="font-semibold">{is.result.byCategory}</h2>
          <ul className="flex flex-col gap-3">
            {summary.byCategory.map((c) => (
              <li key={c.category} className="flex flex-col gap-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span>{is.categories[c.category].name}</span>
                  <span className="tabular-nums">{is.result.score(formatNumber(c.points), c.max)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(c.points / c.max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3">{actions}</div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{is.result.review}</h2>
        <ol className="flex flex-col gap-3" data-testid="review">
          {answers.map((answer, i) => {
            const question = byId.get(answer.questionId);
            const style = OUTCOME_STYLE[answer.outcome];
            return (
              <li key={answer.questionId} className="card p-0">
                <details>
                  <summary className="flex cursor-pointer items-start gap-3 p-4">
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold ${style.className}`}>
                      <span aria-hidden="true">{style.icon} </span>
                      {is.result.outcome[answer.outcome]}
                    </span>
                    <span className="flex-1 font-medium">
                      {i + 1}. {question?.prompt ?? is.result.missingQuestion}
                    </span>
                  </summary>
                  {question && (
                    <div className="flex flex-col gap-3 border-t border-line p-4">
                      <p>
                        {is.feedback.yourAnswer} <strong>{responseText(question, answer.response)}</strong>
                        {answer.outcome !== "correct" || question.type === "estimate" ? (
                          <>
                            <br />
                            {is.feedback.correctAnswer} <strong>{correctAnswerText(question)}</strong>
                          </>
                        ) : null}
                      </p>
                      <p>{question.explanation}</p>
                      <SourceList sources={question.sources} />
                      <p>
                        <a className="link text-sm" href={reportErrorHref(question.id)}>
                          {is.feedback.reportError}
                        </a>
                      </p>
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
