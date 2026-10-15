import type { Metadata } from "next";
import { PracticePicker } from "@/components/PracticePicker";
import { getQuestionBank } from "@/lib/content/bank";
import { is } from "@/i18n/is";

export const metadata: Metadata = { title: is.practice.title };

export default function PracticePage() {
  // Only what the picker needs to count today's questions, not the questions themselves.
  const items = getQuestionBank().map(({ category, validFrom, validUntil }) => ({ category, validFrom, validUntil }));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{is.practice.title}</h1>
      <p className="text-ink-muted">{is.practice.intro}</p>
      <PracticePicker items={items} />
    </div>
  );
}
