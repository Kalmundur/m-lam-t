"use client";

import Link from "next/link";
import { isActive } from "@/lib/content/availability";
import { CATEGORIES, type Category } from "@/lib/content/constants";
import { useIcelandToday } from "@/lib/hooks";
import { is } from "@/i18n/is";

export type PracticeItem = { category: Category; validFrom?: string; validUntil?: string };

/** Category list with how many questions each has today; empty categories can't be chosen. */
export function PracticePicker({ items }: { items: PracticeItem[] }) {
  const today = useIcelandToday();
  return (
    <ul className="flex flex-col gap-3">
      {CATEGORIES.map((category) => {
        const count = items.filter((i) => i.category === category && (!today || isActive(i, today))).length;
        const { name, description } = is.categories[category];
        const body = (
          <>
            <span className="text-lg font-semibold">{name}</span>
            <span className="text-ink-muted">{description}</span>
            <span className="text-sm">{count > 0 ? is.practice.questionCount(count) : is.practice.noQuestions}</span>
          </>
        );
        return (
          <li key={category}>
            {count > 0 ? (
              <Link href={`/aefing/${category}`} className="card flex flex-col gap-1 hover:border-brand">
                {body}
              </Link>
            ) : (
              <div className="card flex flex-col gap-1 border-dashed" aria-disabled="true">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
