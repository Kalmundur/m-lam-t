// Validates all question content. Exits with code 1 if anything is invalid.
//
//   npm run validate
//   npm run validate -- --today 2027-01-01   # preview what will have expired by then

import { parseArgs } from "node:util";
import { icelandToday } from "../src/lib/content/availability";
import { CATEGORIES, PENDING_REVIEWER, isoDate } from "../src/lib/content/schema";
import { validateContent } from "../src/lib/content/validate";
import { readContent } from "./lib/content-files";
import { annotate, markdownTable, textTable, writeJobSummary } from "./lib/report";

const { values } = parseArgs({ options: { today: { type: "string" } } });
const today = values.today ?? icelandToday();
if (!isoDate.safeParse(today).success) {
  console.error(`--today must be an ISO date (YYYY-MM-DD), got "${today}"`);
  process.exit(1);
}

let input;
try {
  input = readContent(today);
} catch (err) {
  annotate("error", (err as Error).message);
  process.exit(1);
}
const result = validateContent(input);

console.log(`Málamót content check (today: ${today})\n`);

const rows = [["category", "verified", "placeholder"]];
for (const category of CATEGORIES) {
  const inCategory = result.questions.filter((q) => q.category === category);
  rows.push([
    category,
    String(inCategory.filter((q) => q.status === "verified").length),
    String(inCategory.filter((q) => q.status === "placeholder").length),
  ]);
}
rows.push([
  "total",
  String(result.questions.filter((q) => q.status === "verified").length),
  String(result.questions.filter((q) => q.status === "placeholder").length),
]);
console.log(textTable(rows));
console.log("(Counts include only questions that passed validation.)\n");

if (result.errors.length || result.warnings.length) {
  console.log(`Issues (${result.errors.length} errors, ${result.warnings.length} warnings):`);
  for (const issue of [...result.errors, ...result.warnings]) {
    annotate(issue.level, issue.questionId ? `${issue.questionId}: ${issue.message}` : issue.message, issue.file);
  }
  console.log();
}

console.log(
  result.expired.length
    ? `Needs review, past validUntil (${result.expired.length}): ${result.expired.map((q) => q.id).join(", ")}`
    : "Needs review, past validUntil: none",
);
if (result.pendingReview.length) {
  annotate(
    "notice",
    `${result.pendingReview.length} verified questions still have reviewedBy "${PENDING_REVIEWER}" and need a human sign-off.`,
  );
}

writeJobSummary(
  `## Question content\n\n${markdownTable(rows)}\n\n` +
    `${result.errors.length} errors, ${result.warnings.length} warnings, ` +
    `${result.expired.length} expired, ${result.pendingReview.length} awaiting human sign-off.\n`,
);

if (result.errors.length) {
  console.log(`\n✖ Validation failed with ${result.errors.length} error(s).`);
  process.exit(1);
}
console.log(`\n✔ All ${result.questions.length} questions are valid.`);
