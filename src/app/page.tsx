import Link from "next/link";
import { DailyCard } from "@/components/DailyCard";
import { is } from "@/i18n/is";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl leading-tight font-semibold">{is.app.tagline}</h1>
        <p className="text-ink-muted">{is.home.intro}</p>
      </div>
      <DailyCard />
      <section className="card flex flex-col gap-3" aria-labelledby="practice-title">
        <h2 id="practice-title" className="text-xl font-semibold">
          {is.home.practiceTitle}
        </h2>
        <p className="text-ink-muted">{is.home.practiceHint}</p>
        <Link href="/aefing" className="button-secondary">
          {is.home.practiceLink}
        </Link>
      </section>
    </div>
  );
}
