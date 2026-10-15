import type { Metadata } from "next";
import { DailyQuiz } from "@/components/DailyQuiz";
import { getQuestionBank } from "@/lib/content/bank";
import { is } from "@/i18n/is";

export const metadata: Metadata = { title: is.daily.title };

export default function DailyPage() {
  return <DailyQuiz bank={getQuestionBank()} />;
}
