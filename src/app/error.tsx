"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { is } from "@/i18n/is";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="card flex flex-col gap-3" role="alert">
      <h1 className="text-xl font-semibold">{is.error.title}</h1>
      <p>{is.error.text}</p>
      <button type="button" className="button-primary" onClick={() => retry()}>
        {is.error.retry}
      </button>
      <Link href="/" className="link">
        {is.result.backHome}
      </Link>
    </div>
  );
}
