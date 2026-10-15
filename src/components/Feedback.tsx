import { useId, type Ref } from "react";
import type { Question } from "@/lib/content/schema";
import { correctAnswerText, responseText } from "@/lib/quiz/answer-text";
import type { ScoredAnswer } from "@/lib/quiz/scoring";
import { reportErrorHref } from "@/lib/report-error";
import { is } from "@/i18n/is";
import { SourceList } from "./SourceList";

const TONE = {
  correct: { box: "border-good bg-good-soft", text: "text-good" },
  wrong: { box: "border-bad bg-bad-soft", text: "text-bad" },
} as const;

type Props = {
  question: Question;
  answer: ScoredAnswer;
  /** Varies the encouraging line between questions. */
  position: number;
  ref?: Ref<HTMLElement>;
};

/** Shown after answering: right or wrong, the explanation, sources and a report link. */
export function Feedback({ question, answer, position, ref }: Props) {
  const headingId = useId();
  const lines = is.feedback[answer.outcome];
  const tone = TONE[answer.outcome];
  const isEstimate = question.type === "estimate";

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={`flex flex-col gap-3 rounded-2xl border-l-4 p-5 ${tone.box}`}
    >
      <h3 id={headingId} className={`text-lg font-semibold ${tone.text}`}>
        {lines[position % lines.length]}
      </h3>
      {(isEstimate || answer.outcome !== "correct") && (
        <p>
          {is.feedback.correctAnswer} <strong>{correctAnswerText(question)}</strong>
          {isEstimate && (
            <>
              <br />
              {is.feedback.yourGuess} {responseText(question, answer.response)}
            </>
          )}
        </p>
      )}
      <p>{question.explanation}</p>
      <SourceList sources={question.sources} />
      <p>
        <a className="link text-sm" href={reportErrorHref(question.id)}>
          {is.feedback.reportError}
        </a>
      </p>
    </section>
  );
}
