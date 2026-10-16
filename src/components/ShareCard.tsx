"use client";

import { useId, useState } from "react";
import { is } from "@/i18n/is";

type Status = "idle" | "copied" | "failed";

/**
 * The spoiler-free result with a share button (Web Share API, where the browser
 * has it) and a copy button. Only rendered in the browser, so reading
 * `navigator` here is safe.
 */
export function ShareCard({ text, streak }: { text: string; streak: number }) {
  const titleId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const canShare = typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
    } catch (error) {
      // The player closed the share sheet: nothing to do. Anything else: fall back to copying.
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <section className="card flex flex-col gap-3" aria-labelledby={titleId}>
      <h2 id={titleId} className="font-semibold">
        {is.share.title}
      </h2>
      {streak > 0 && (
        <p className="font-medium" data-testid="streak">
          <span aria-hidden="true">🔥 </span>
          {is.streak(streak)}
        </p>
      )}
      <p className="text-sm text-ink-muted">{is.share.hint}</p>
      <pre
        className="rounded-lg bg-page p-3 font-sans text-sm whitespace-pre-wrap"
        data-testid="share-text"
      >
        {text}
      </pre>
      <div className="flex gap-3">
        {canShare && (
          <button type="button" className="button-primary" onClick={share}>
            {is.share.share}
          </button>
        )}
        <button type="button" className={canShare ? "button-secondary" : "button-primary"} onClick={copy}>
          {is.share.copy}
        </button>
      </div>
      <p role="status" className="min-h-5 text-sm">
        {status === "copied" ? is.share.copied : status === "failed" ? is.share.copyFailed : ""}
      </p>
    </section>
  );
}
