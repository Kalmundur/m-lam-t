import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeQuiz } from "@/components/PracticeQuiz";
import { getQuestionBank } from "@/lib/content/bank";
import { CATEGORIES, type Category } from "@/lib/content/constants";
import { is } from "@/i18n/is";

// One static page per category; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((flokkur) => ({ flokkur }));
}

function toCategory(value: string): Category {
  if (!(CATEGORIES as readonly string[]).includes(value)) notFound();
  return value as Category;
}

export async function generateMetadata(props: PageProps<"/aefing/[flokkur]">): Promise<Metadata> {
  const category = toCategory((await props.params).flokkur);
  return { title: `${is.practice.title}: ${is.categories[category].name}` };
}

export default async function PracticeCategoryPage(props: PageProps<"/aefing/[flokkur]">) {
  const category = toCategory((await props.params).flokkur);
  const questions = getQuestionBank().filter((q) => q.category === category);
  return <PracticeQuiz category={category} bank={questions} />;
}
