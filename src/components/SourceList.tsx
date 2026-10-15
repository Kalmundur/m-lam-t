import type { Source } from "@/lib/content/schema";
import { is } from "@/i18n/is";

export function SourceList({ sources }: { sources: readonly Source[] }) {
  if (sources.length === 0) return <p className="text-sm text-ink-muted">{is.feedback.noSources}</p>;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-semibold">{is.feedback.sources}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {sources.map((s) => (
          <li key={s.url}>
            <a className="link break-words" href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
              <span className="sr-only"> {is.feedback.opensInNewTab}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
