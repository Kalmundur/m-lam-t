"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SHOW_PLACEHOLDERS } from "@/config";
import { isPlayable } from "@/lib/content/availability";
import type { Question } from "@/lib/content/schema";
import { formatLongDate } from "@/lib/format";
import { useIcelandToday, useStorageAvailable, useStoredValue } from "@/lib/hooks";
import {
  DAILY_STORAGE_KEY,
  addAnswer,
  finishRecord,
  isRecordComplete,
  newDailyRecord,
  parseDailyHistory,
  serializeDailyHistory,
  type DailyRecord,
} from "@/lib/quiz/progress";
import { arrangeDailyOptions, dailyQuestionIds } from "@/lib/quiz/select";
import { shareText } from "@/lib/quiz/share";
import { currentStreak } from "@/lib/quiz/streak";
import { isStorageAvailable, readStorage, writeStorage } from "@/lib/storage";
import { is } from "@/i18n/is";
import { QuizRunner } from "./QuizRunner";
import { ResultView } from "./ResultView";
import { ShareCard } from "./ShareCard";
import { EmptyState, Loading, StorageNotice } from "./StatusMessage";

/** Today's stored attempt, or a fresh one. A fully answered attempt counts as finished. */
function loadRecord(bank: Question[], date: string): DailyRecord {
  const stored = parseDailyHistory(readStorage(DAILY_STORAGE_KEY))[date];
  if (stored) return isRecordComplete(stored) ? finishRecord(stored) : stored;
  const pool = bank.filter((q) => isPlayable(q, { today: date, showPlaceholders: SHOW_PLACEHOLDERS }));
  return newDailyRecord(date, dailyQuestionIds(pool, date));
}

export function DailyQuiz({ bank }: { bank: Question[] }) {
  const today = useIcelandToday();
  if (!today) return <Loading />;
  return <DailySession bank={bank} initialDate={today} />;
}

function DailySession({ bank, initialDate }: { bank: Question[]; initialDate: string }) {
  // Keep the date the quiz started on, even if the clock passes midnight mid-quiz.
  const [date] = useState(initialDate);
  const [record, setRecord] = useState(() => loadRecord(bank, date));
  const [justFinished, setJustFinished] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const storageAvailable = useStorageAvailable();
  const storedHistory = useStoredValue(DAILY_STORAGE_KEY);

  const questions = useMemo(() => {
    const byId = new Map(bank.map((q) => [q.id, q]));
    return record.questionIds.flatMap((id) => {
      const q = byId.get(id);
      return q ? [arrangeDailyOptions(q, date)] : [];
    });
  }, [bank, record.questionIds, date]);

  function save(next: DailyRecord) {
    setRecord(next);
    // Re-read so other days' history is kept. Without storage the quiz still
    // works for this visit; it just isn't remembered.
    const history = parseDailyHistory(readStorage(DAILY_STORAGE_KEY));
    const saved = writeStorage(DAILY_STORAGE_KEY, serializeDailyHistory({ ...history, [date]: next }));
    if (!saved && isStorageAvailable()) setSaveFailed(true);
  }

  const notice = !storageAvailable ? (
    <StorageNotice text={is.storage.unavailable} />
  ) : saveFailed ? (
    <StorageNotice text={is.storage.saveFailed} />
  ) : null;

  if (questions.length === 0) {
    return <EmptyState text={is.daily.empty} href="/" linkText={is.result.backHome} />;
  }

  if (record.finished) {
    const streak = currentStreak(parseDailyHistory(storedHistory), date);
    return (
      <div className="flex flex-col gap-4">
        {notice}
        <ResultView
          title={is.daily.title}
          subtitle={formatLongDate(date)}
          questions={questions}
          answers={record.answers}
          focusOnMount={justFinished}
          extra={<ShareCard text={shareText(record, window.location.origin)} streak={streak} />}
          actions={
            <Link href="/" className="button-secondary">
              {is.result.backHome}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-medium text-ink-muted">
        {is.daily.title} · {formatLongDate(date)}
      </h1>
      {notice}
      <QuizRunner
        questions={questions}
        answers={record.answers}
        onAnswer={(answer) => save(addAnswer(record, answer))}
        onFinish={() => {
          setJustFinished(true);
          save(finishRecord(record));
        }}
      />
    </div>
  );
}
