import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ContentFile, ContentInput } from "../../src/lib/content/validate";

// npm runs scripts from the package root, so paths are relative to the working directory.
export const QUESTIONS_DIR = "content/questions";
export const PARTIES_FILE = "content/parties.json";
export const RETIRED_IDS_FILE = "content/retired-ids.json";

function readJson(file: string): ContentFile {
  const text = readFileSync(file, "utf8");
  try {
    return { file, data: JSON.parse(text) };
  } catch (err) {
    throw new Error(`${file}: invalid JSON (${(err as Error).message})`);
  }
}

/** Reads every content file the validator needs. Throws on unreadable or malformed JSON. */
export function readContent(today: string): ContentInput {
  const questionFiles = readdirSync(QUESTIONS_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.posix.join(QUESTIONS_DIR, name)));

  return {
    questionFiles,
    parties: readJson(PARTIES_FILE),
    retiredIds: existsSync(RETIRED_IDS_FILE) ? readJson(RETIRED_IDS_FILE) : { file: RETIRED_IDS_FILE, data: [] },
    today,
  };
}
