import { CONTACT_EMAIL } from "../config";
import { is } from "../i18n/is";

/** mailto: link for reporting a mistake in a question, with its id filled in. */
export function reportErrorHref(questionId: string): string {
  const subject = encodeURIComponent(is.feedback.reportSubject(questionId));
  const body = encodeURIComponent(is.feedback.reportBody(questionId));
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
