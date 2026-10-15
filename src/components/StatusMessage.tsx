import Link from "next/link";
import { is } from "@/i18n/is";

/** Shown while client-only state (today's date, stored progress) is being read. */
export function Loading() {
  return (
    <p role="status" className="py-8 text-center text-ink-muted">
      {is.app.loading}
    </p>
  );
}

/** A short message with a way out, e.g. when there are no questions to play. */
export function EmptyState({ text, href, linkText }: { text: string; href: string; linkText: string }) {
  return (
    <div className="card flex flex-col gap-3">
      <p>{text}</p>
      <Link className="link" href={href}>
        {linkText}
      </Link>
    </div>
  );
}
