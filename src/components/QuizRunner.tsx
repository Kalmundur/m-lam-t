"use client";

import { useState } from "react";
import type { Question } from "@/lib/content/schema";
import { answerQuestion, type ScoredAnswer } from "@/lib/quiz/scoring";
import { is } from "@/i18n/is";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: Question[];
  /** Answers so far, owned by the parent so it can store them. */
  answers: ScoredAnswer[];
  onAnswer: (answer: ScoredAnswer) => void;
  onFinish: () => void;
  /** Focus the first question when it appears (e.g. after "Æfa aftur"). */
  autoFocus?: boolean;
};

/** Steps through the questions: answer, read the feedback, go to the next unanswered one. */
export function QuizRunner({ questions, answers, onAnswer, onFinish, autoFocus = false }: Props) {
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [moveFocus, setMoveFocus] = useState(autoFocus);
  const answered = new Map(answers.map((a) => [a.questionId, a]));

  const index =
    feedbackFor !== null
      ? questions.findIndex((q) => q.id === feedbackFor)
      : questions.findIndex((q) => !answered.has(q.id));

  if (index === -1) {
    // Everything is answered, e.g. the page was reloaded right after the last answer.
    return (
      <button type="button" className="button-primary" onClick={onFinish}>
        {is.question.seeResults}
      </button>
    );
  }

  const question = questions[index];
  const isLast = questions.every((q) => q.id === question.id || answered.has(q.id));

  return (
    <QuestionCard
      key={question.id}
      question={question}
      position={index + 1}
      total={questions.length}
      answer={answered.get(question.id)}
      isLast={isLast}
      focusOnMount={moveFocus}
      onSubmit={(response) => {
        onAnswer(answerQuestion(question, response));
        setFeedbackFor(question.id);
        setMoveFocus(true);
      }}
      onNext={() => {
        setFeedbackFor(null);
        if (isLast) onFinish();
      }}
    />
  );
}
