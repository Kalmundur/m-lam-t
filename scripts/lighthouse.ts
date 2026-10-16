// Runs Lighthouse's accessibility audit, with its default mobile settings, on
// every page of the static build. Fails if any page scores below 95.
// Run `npm run build` first. Uses the installed Chrome, or CHROME_PATH.
//
//   npm run lighthouse

import { launch } from "chrome-launcher";
import { startStaticServer } from "./lib/static-server";
import { annotate, markdownTable, textTable, writeJobSummary } from "./lib/report";

const MIN_SCORE = 95;
const PORT = 3200;
// Pages as a first-time visitor sees them (Lighthouse starts with empty storage).
// The answered-question and result states are covered by the axe checks in e2e/.
const PAGES = ["/", "/dagsins", "/aefing", "/aefing/kerfid", "/um"];

async function main() {
  // Loaded dynamically so it stays a native ES module. A static import is converted
  // to CommonJS by tsx, which adds a `__name` helper to Lighthouse's functions; those
  // functions are later run inside the page, where the helper doesn't exist.
  const { default: lighthouse } = await import("lighthouse");
  const server = await startStaticServer({ dir: "out", port: PORT });
  const chrome = await launch({
    chromeFlags: ["--headless=new", ...(process.env.CI ? ["--no-sandbox"] : [])],
  });
  const rows = [["page", "score", "failing audits"]];
  let failed = false;

  try {
    for (const page of PAGES) {
      const result = await lighthouse(`http://localhost:${PORT}${page}`, {
        port: chrome.port,
        onlyCategories: ["accessibility"],
        logLevel: "error",
      });
      if (!result) throw new Error(`Lighthouse returned no result for ${page}`);
      const { lhr } = result;
      if (lhr.runtimeError) throw new Error(`${page}: ${lhr.runtimeError.message}`);

      const category = lhr.categories.accessibility;
      const score = Math.round((category.score ?? 0) * 100);
      const failing = category.auditRefs
        .map((ref) => lhr.audits[ref.id])
        .filter((audit) => audit.score !== null && audit.score < 1)
        .map((audit) => audit.id);
      rows.push([page, String(score), failing.join(", ") || "none"]);

      if (score < MIN_SCORE) {
        failed = true;
        annotate("error", `Lighthouse accessibility for ${page} is ${score} (minimum ${MIN_SCORE})`);
      }
    }
  } finally {
    chrome.kill();
    server.close();
  }

  console.log(`Lighthouse accessibility, mobile (minimum ${MIN_SCORE})\n`);
  console.log(textTable(rows));
  writeJobSummary(`## Lighthouse accessibility (mobile)\n\n${markdownTable(rows)}\n`);
  if (failed) process.exit(1);
}

main().catch((error: Error) => {
  annotate("error", error.message);
  process.exit(1);
});
