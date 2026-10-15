import type { Question } from "../content/schema";
import { formatNumber } from "../format";
import type { Response } from "./scoring";

function estimateText(q: Question, value: number): string {
  return `${formatNumber(value)} ${q.estimate?.unit ?? ""}`.trim();
}

/** A player's response as text: the option they chose, or their number with its unit. */
export function responseText(q: Question, response: Response): string {
  if (q.type === "estimate") return estimateText(q, Number(response));
  return q.options?.find((o) => o.id === response)?.text ?? String(response);
}

/** The correct answer as text. */
export function correctAnswerText(q: Question): string {
  if (q.type === "estimate") return q.estimate ? estimateText(q, q.estimate.answer) : "";
  return responseText(q, q.correctOptionId ?? "");
}
