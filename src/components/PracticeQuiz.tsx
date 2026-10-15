"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SHOW_PLACEHOLDERS } from "@/config";
import { isPlayable } from "@/lib/content/availability";
import type { Category } from "@/lib/content/constants";
import type { Question } from "@/lib/content/schema";
import { useIcelandToday } from "@/lib/hooks";
import { randomSeed } from "@/lib/quiz/random";
import type { ScoredAnswer } from "@/lib/quiz/scoring";
import { practiceQuestions } from "@/lib/quiz/select";
import { is } from "@/i18n/is";
import { QuizRunner } from "./QuizRunner";
import { ResultView } from "./ResultView";
import { EmptyState, Loading } from "./StatusMessage";

type Run = { seed: number; number: number; answers: ScoredAnswer[]; finished: boolean };

function newRun(number: number): Run {
  return { seed: randomSeed(), number, answers: [], finished: false };
}

export function PracticeQuiz({ category, bank }: { category: Category; bank: Question[] }) {
  const today = useIcelandToday();
  if (!today) return <Loading />;
  return <PracticeSession category={category} bank={bank} today={today} />;
}

function PracticeSession({ category, bank, today }: { category: Category; bank: Question[]; today: string }) {
  const pool = useMemo(
    () => bank.filter((q) => isPlayable(q, { today, showPlaceholders: SHOW_PLACEHOLDERS })),
    [bank, today],
  );
  const [run, setRun] = useState(() => newRun(1));
  const questions = useMemo(() => practiceQuestions(pool, run.seed), [pool, run.seed]);
  const title = `${is.practice.title}: ${is.categories[category].name}`;

  if (pool.length === 0) {
    return <EmptyState text={is.practice.empty} href="/aefing" linkText={is.practice.otherCategory} />;
  }

  if (run.finished) {
    return (
      <ResultView
        title={title}
        questions={questions}
        answers={run.answers}
        focusOnMount
        actions={
          <>
            <button type="button" className="button-primary" onClick={() => setRun(newRun(run.number + 1))}>
              {is.practice.playAgain}
            </button>
            <Link href="/aefing" className="button-secondary">
              {is.practice.otherCategory}
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-medium text-ink-muted">{title}</h1>
      <QuizRunner
        key={run.seed}
        questions={questions}
        answers={run.answers}
        autoFocus={run.number > 1}
        onAnswer={(answer) => setRun((r) => ({ ...r, answers: [...r.answers, answer] }))}
        onFinish={() => setRun((r) => ({ ...r, finished: true }))}
      />
    </div>
  );
}
