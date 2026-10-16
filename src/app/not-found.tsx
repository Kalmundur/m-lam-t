import type { Metadata } from "next";
import Link from "next/link";
import { is } from "@/i18n/is";

export const metadata: Metadata = { title: is.notFound.title };

export default function NotFound() {
  return (
    <div className="card flex flex-col gap-3">
      <h1 className="text-xl font-semibold">{is.notFound.title}</h1>
      <p>{is.notFound.text}</p>
      <Link href="/" className="link">
        {is.result.backHome}
      </Link>
    </div>
  );
}
