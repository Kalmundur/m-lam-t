import atkvaedi from "../../../content/questions/atkvaedi.json";
import flokkarnir from "../../../content/questions/flokkarnir.json";
import folkid from "../../../content/questions/folkid.json";
import kerfid from "../../../content/questions/kerfid.json";
import stefna from "../../../content/questions/stefna.json";
import tolur from "../../../content/questions/tolur.json";
import parties from "../../../content/parties.json";
import retiredIds from "../../../content/retired-ids.json";
import { SHOW_PLACEHOLDERS } from "../../config";
import { icelandToday } from "./availability";
import type { Question } from "./schema";
import { validateContent } from "./validate";

// The question bank, built at build time in server components. It runs the same
// validation as `npm run validate`, so an invalid question never reaches the page,
// and only verified questions are included unless placeholders are switched on.
// Date filtering (validFrom/validUntil) happens in the browser, because the
// static build can be older than the day it is played.

/** Keeps verified questions, plus placeholders when explicitly enabled. */
export function filterForRelease(questions: readonly Question[], showPlaceholders: boolean): Question[] {
  return questions.filter((q) => q.status === "verified" || showPlaceholders);
}

let cached: Question[] | undefined;

export function getQuestionBank(): Question[] {
  if (cached) return cached;
  const result = validateContent({
    questionFiles: Object.entries({ kerfid, flokkarnir, stefna, atkvaedi, tolur, folkid }).map(([name, data]) => ({
      file: `content/questions/${name}.json`,
      data,
    })),
    parties: { file: "content/parties.json", data: parties },
    retiredIds: { file: "content/retired-ids.json", data: retiredIds },
    today: icelandToday(),
  });
  for (const e of result.errors) {
    console.error(`Question content error, question skipped: ${e.file} ${e.questionId ?? ""} ${e.message}`);
  }
  cached = filterForRelease(result.questions, SHOW_PLACEHOLDERS);
  return cached;
}
