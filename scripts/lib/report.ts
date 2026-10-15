import { appendFileSync } from "node:fs";

// Console output that doubles as GitHub Actions annotations when running in CI.

const inGitHubActions = process.env.GITHUB_ACTIONS === "true";

// https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
function escapeData(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

export function annotate(level: "error" | "warning" | "notice", message: string, file?: string): void {
  if (inGitHubActions) {
    const props = file ? ` file=${escapeProperty(file)}` : "";
    console.log(`::${level}${props}::${escapeData(message)}`);
  } else {
    const label = { error: "error  ", warning: "warning", notice: "notice " }[level];
    console.log(`  ${label} ${file ? `${file}: ` : ""}${message}`);
  }
}

/** Appends Markdown to the GitHub Actions job summary; no-op elsewhere. */
export function writeJobSummary(markdown: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) appendFileSync(summaryFile, `${markdown}\n`);
}

/** Renders rows as a fixed-width text table; the first row is the header. */
export function textTable(rows: string[][]): string {
  const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
  const line = (row: string[]) =>
    row.map((cell, col) => (col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col]))).join("  ");
  return [line(rows[0]), widths.map((w) => "-".repeat(w)).join("  "), ...rows.slice(1).map(line)].join("\n");
}

export function markdownTable(rows: string[][]): string {
  const line = (row: string[]) => `| ${row.join(" | ")} |`;
  const align = rows[0].map((_, col) => (col === 0 ? ":--" : "--:"));
  return [line(rows[0]), line(align), ...rows.slice(1).map(line)].join("\n");
}
