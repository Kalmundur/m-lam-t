"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Question } from "@/lib/content/schema";
import type { Response, ScoredAnswer } from "@/lib/quiz/scoring";
import { is } from "@/i18n/is";
import { EstimateInput, initialGuess } from "./EstimateInput";
import { Feedback } from "./Feedback";

type Props = {
  question: Question;
  position: number;
  total: number;
  /** Set once the question has been answered; switches the card to feedback. */
  answer: ScoredAnswer | undefined;
  isLast: boolean;
  /** Move focus to the prompt when the card appears (after "Næsta", not on page load). */
  focusOnMount: boolean;
  onSubmit: (response: Response) => void;
  onNext: () => void;
};

export function QuestionCard({ question, position, total, answer, isLast, focusOnMount, onSubmit, onNext }: Props) {
  const promptId = useId();
  const promptRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [guess, setGuess] = useState(() => (question.estimate ? initialGuess(question.estimate) : 0));
  const answered = answer !== undefined;
  const isEstimate = question.type === "estimate";

  useEffect(() => {
    if (focusOnMount) promptRef.current?.focus();
  }, [focusOnMount]);

  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (answered) return;
    if (isEstimate) onSubmit(guess);
    else if (selected !== null) onSubmit(selected);
  }

  return (
    <article className="flex flex-col gap-4" aria-labelledby={promptId}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
          <span>{is.question.progress(position, total)}</span>
          <span>{is.categories[question.category].name}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(position / total) * 100}%` }} />
        </div>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-ink-muted">{is.questionTypes[question.type]}</span>
          {question.status === "placeholder" && (
            <span className="rounded-md bg-sample-soft px-2 py-0.5 text-xs font-bold tracking-wide text-sample">
              {is.question.placeholderBadge}
            </span>
          )}
        </div>
        <h2 ref={promptRef} id={promptId} tabIndex={-1} className="text-xl leading-snug font-semibold">
          {question.prompt}
        </h2>
        {question.status === "placeholder" && <p className="text-sm text-sample">{is.question.placeholderNote}</p>}

        {isEstimate && question.estimate ? (
          <EstimateInput
            estimate={question.estimate}
            value={guess}
            onChange={setGuess}
            disabled={answered}
            describedBy={promptId}
          />
        ) : (
          <fieldset className="flex flex-col gap-2" disabled={answered} aria-labelledby={promptId}>
            {question.options?.map((option) => {
              const isCorrect = option.id === question.correctOptionId;
              const isChosen = answered ? answer.response === option.id : selected === option.id;
              const tone = !answered
                ? isChosen
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-card hover:border-brand"
                : isCorrect
                  ? "border-good bg-good-soft"
                  : isChosen
                    ? "border-bad bg-bad-soft"
                    : "border-line bg-card";
              return (
                <label
                  key={option.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 has-disabled:cursor-default ${tone}`}
                >
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={option.id}
                    checked={isChosen}
                    onChange={() => setSelected(option.id)}
                    className="size-5 shrink-0 accent-brand"
                  />
                  <span className="flex-1">{option.text}</span>
                  {answered && isCorrect && (
                    <span className="text-sm font-semibold whitespace-nowrap text-good">✓ {is.feedback.correctMark}</span>
                  )}
                  {answered && isChosen && !isCorrect && (
                    <span className="text-sm font-semibold whitespace-nowrap text-bad">✗ {is.feedback.yourMark}</span>
                  )}
                </label>
              );
            })}
          </fieldset>
        )}

        {!answered && (
          <button type="submit" className="button-primary" disabled={!isEstimate && selected === null}>
            {is.question.submit}
          </button>
        )}
      </form>

      {answered && (
        <>
          <Feedback ref={feedbackRef} question={question} answer={answer} position={position} />
          <button type="button" className="button-primary" onClick={onNext}>
            {isLast ? is.question.seeResults : is.question.next}
          </button>
        </>
      )}
    </article>
  );
}
