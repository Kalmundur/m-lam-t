import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/config";
import { is } from "@/i18n/is";

export const metadata: Metadata = { title: is.about.title };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{is.about.title}</h1>
        <p>{is.about.intro}</p>
      </div>
      <Section title={is.about.neutralityTitle}>
        <List items={is.about.neutrality} />
      </Section>
      <Section title={is.about.sourcesTitle}>
        <List items={is.about.sources} />
      </Section>
      <Section title={is.about.reportTitle}>
        <p>
          {is.about.report}{" "}
          <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
      <Section title={is.about.privacyTitle}>
        <List items={is.about.privacy} />
      </Section>
    </article>
  );
}
