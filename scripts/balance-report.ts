// Prints how many active, verified questions concern each party, per category.
// Warns (never fails) when a party is over- or under-represented in a checked category.
//
//   npm run balance

import { parseArgs } from "node:util";
import { icelandToday } from "../src/lib/content/availability";
import {
  BALANCE_CHECKED_CATEGORIES,
  BALANCE_LOWER_RATIO,
  BALANCE_UPPER_RATIO,
  computeBalance,
} from "../src/lib/content/balance";
import { CATEGORIES, isoDate } from "../src/lib/content/schema";
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
if (!result.registry) {
  annotate("error", "The party registry is invalid, so balance cannot be computed. Run `npm run validate`.");
  process.exit(1);
}

const report = computeBalance(result.questions, result.registry.parties, today);
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const rows = [["party", ...CATEGORIES, "total", "checked"]];
for (const p of report.parties) {
  rows.push([
    `${p.letter} ${p.shortName ?? p.name}`,
    ...CATEGORIES.map((c) => String(report.counts[p.letter][c])),
    String(report.totals[p.letter]),
    p.inBalanceCheck ? "yes" : "no",
  ]);
}
rows.push(["average per checked party", ...CATEGORIES.map((c) => fmt(report.averages[c])), "", ""]);
rows.push([
  "questions in category",
  ...CATEGORIES.map((c) => String(report.questionsPerCategory[c])),
  String(CATEGORIES.reduce((sum, c) => sum + report.questionsPerCategory[c], 0)),
  "",
]);

console.log(`Málamót party balance (active verified questions, today: ${today})\n`);
console.log(textTable(rows));
console.log(
  `\nChecked categories: ${BALANCE_CHECKED_CATEGORIES.join(", ")}. ` +
    `Checked parties (inBalanceCheck): ${report.checkedParties.join(", ") || "none"}. ` +
    `A checked party is flagged outside ${BALANCE_LOWER_RATIO}×–${BALANCE_UPPER_RATIO}× the category average.`,
);
if (result.errors.length) {
  console.log(`Note: ${result.errors.length} validation error(s); invalid questions are not counted. Run \`npm run validate\`.`);
}
if (report.noData.length) {
  console.log(`No verified questions about checked parties yet in: ${report.noData.join(", ")} (not checked).`);
}

const warningLines = report.warnings.map(
  (w) =>
    `${w.category}: ${w.party} has ${w.count} question(s), ${w.ratio.toFixed(2)}× the average of ${fmt(w.average)}`,
);
if (warningLines.length) {
  console.log(`\nBalance warnings (${warningLines.length}):`);
  for (const line of warningLines) annotate("warning", `Party balance: ${line}`);
} else {
  console.log("\n✔ No balance warnings.");
}

writeJobSummary(
  `## Party balance\n\n${markdownTable(rows)}\n\n` +
    (warningLines.length ? warningLines.map((l) => `- ⚠️ ${l}`).join("\n") : "No balance warnings.") +
    "\n",
);
