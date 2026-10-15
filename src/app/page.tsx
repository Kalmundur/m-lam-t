import { is } from "@/i18n/is";

// Placeholder home page for M1; the real Forsíða arrives with the quiz in M2.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{is.app.name}</h1>
      <p className="text-lg">{is.app.tagline}</p>
      <p className="opacity-80">{is.home.comingSoon}</p>
    </main>
  );
}
