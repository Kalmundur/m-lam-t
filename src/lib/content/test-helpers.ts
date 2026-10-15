import type { Question } from "./schema";

const SOURCE = {
  title: "Almennar upplýsingar um alþingiskosningar",
  url: "https://www.althingi.is/thingmenn/althingiskosningar/almennar-upplysingar/",
  accessed: "2026-10-15",
};

/** A valid verified multiple-choice question; override fields per test. */
export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "kerfid-0001",
    type: "multiple_choice",
    category: "kerfid",
    status: "verified",
    difficulty: 1,
    prompt: "Í hve mörg kjördæmi er landinu skipt?",
    options: [
      { id: "a", text: "Fjögur" },
      { id: "b", text: "Sex" },
      { id: "c", text: "Átta" },
    ],
    correctOptionId: "b",
    explanation: "Kjördæmin eru sex.",
    sources: [SOURCE],
    reviewedBy: "pending-human",
    ...overrides,
  };
}

/** Removes keys, for testing missing fields. */
export function without<T extends object>(obj: T, ...keys: (keyof T)[]): Partial<T> {
  const copy = { ...obj };
  for (const key of keys) delete copy[key];
  return copy;
}
