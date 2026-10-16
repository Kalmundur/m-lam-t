import { formatShortDate } from "../format";
import { is } from "../../i18n/is";
import type { DailyRecord } from "./progress";

const SQUARE = { correct: "🟩", wrong: "🟥" } as const;

/**
 * Spoiler-free result for sharing, e.g. "Málamót 15.10. 5/7 🟩🟩🟥🟩🟩🟥🟩".
 * Squares follow the order the questions were asked. The record is used on its
 * own, so the text stays the same even if a question is later removed.
 */
export function shareText(record: DailyRecord, url?: string): string {
  const byId = new Map(record.answers.map((a) => [a.questionId, a]));
  const answers = record.questionIds.flatMap((id) => byId.get(id) ?? []);
  const points = answers.filter((a) => a.outcome === "correct").length;
  const squares = answers.map((a) => SQUARE[a.outcome]).join("");
  const line = is.share.text(formatShortDate(record.date), points, answers.length, squares);
  return url ? `${line}\n${url}` : line;
}
