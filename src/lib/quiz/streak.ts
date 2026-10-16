import { isRecordComplete, type DailyHistory } from "./progress";

function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive days with a completed daily quiz, counting back from today. If
 * today's quiz isn't done yet the count starts at yesterday: the streak is
 * still alive until the day ends.
 */
export function currentStreak(history: DailyHistory, today: string): number {
  let day = isRecordComplete(history[today]) ? today : previousDay(today);
  let count = 0;
  while (isRecordComplete(history[day])) {
    count++;
    day = previousDay(day);
  }
  return count;
}
