// All user-facing text lives here so an English translation can be added later
// (en.ts with the same shape). Code and identifiers stay in English.

import type { Category, QuestionType } from "../lib/content/constants";

/** Icelandic noun agreement with a count: 1, 21, 31… take the singular, but not 11. */
function plural(n: number, one: string, many: string): string {
  return n % 10 === 1 && n % 100 !== 11 ? one : many;
}

const categories: Record<Category, { name: string; description: string }> = {
  kerfid: { name: "Kerfið", description: "Kosningakerfið, Alþingi, forsetinn og stjórnarmyndun" },
  flokkarnir: { name: "Flokkarnir", description: "Flokkar, formenn og listabókstafir" },
  stefna: { name: "Stefnan", description: "Stefnumál og kosningaloforð flokkanna" },
  atkvaedi: { name: "Atkvæðin", description: "Hvernig var kosið á Alþingi" },
  tolur: { name: "Tölurnar", description: "Fjárlög, kjörsókn, þingsæti og fleira" },
  folkid: { name: "Fólkið", description: "Hver gegnir hvaða embætti" },
};

const questionTypes: Record<QuestionType, string> = {
  multiple_choice: "Krossaspurning",
  who_promised: "Hver lofaði þessu?",
  vote_record: "Hvernig var kosið?",
  estimate: "Ágiskun",
  true_false: "Satt eða ósatt",
};

export const is = {
  app: {
    name: "Málamót",
    tagline: "Hvað veistu um íslensk stjórnmál?",
    description:
      "Daglegt próf um íslensk stjórnmál: flokkana, stefnumálin, atkvæðagreiðslur og kosningakerfið. Hverju svari fylgir útskýring og heimild.",
    skipToContent: "Fara beint í efni",
    noScript: "Málamót þarf JavaScript til að virka.",
    loading: "Hleð…",
  },
  categories,
  questionTypes,
  home: {
    intro: "Spurningar um flokkana, stefnumálin, atkvæðagreiðslur og kosningakerfið. Hverju svari fylgir útskýring og heimild.",
    dailyTitle: "Dagsins próf",
    dailyHint: "Sjö spurningar, þær sömu fyrir alla í dag.",
    takeDaily: "Taka dagsins próf",
    continueDaily: (answered: number, total: number) => `Halda áfram (${answered} af ${total} svarað)`,
    dailyDone: (score: string, total: number) => `Þú fékkst ${score} af ${total} í dag. Nýtt próf kemur á morgun.`,
    seeResults: "Sjá niðurstöður",
    practiceTitle: "Æfing",
    practiceHint: "Veldu efnisflokk og æfðu þig eins oft og þú vilt.",
    practiceLink: "Fara í æfingu",
  },
  daily: {
    title: "Dagsins próf",
    empty: "Engar spurningar eru í boði í dag. Kíktu aftur síðar.",
  },
  practice: {
    title: "Æfing",
    intro: "Veldu efnisflokk. Þú færð allt að tíu spurningar í handahófskenndri röð og getur æft eins oft og þú vilt.",
    questionCount: (n: number) => `${n} ${plural(n, "spurning", "spurningar")}`,
    noQuestions: "Engar spurningar enn",
    empty: "Engar spurningar eru í boði í þessum flokki enn.",
    playAgain: "Æfa aftur",
    otherCategory: "Velja annan flokk",
  },
  question: {
    progress: (n: number, total: number) => `Spurning ${n} af ${total}`,
    placeholderBadge: "SÝNISHORN",
    placeholderNote: "Sýnishorn, ekki raunveruleg spurning.",
    submit: "Svara",
    next: "Næsta spurning",
    seeResults: "Sjá niðurstöður",
    estimateLabel: "Þín ágiskun",
    estimateNumberLabel: "Eða sláðu inn tölu",
    estimateRange: (min: string, max: string) => `Frá ${min} til ${max}`,
  },
  feedback: {
    correct: ["Rétt!", "Vel gert!", "Alveg rétt!"],
    partial: ["Nálægt!", "Ansi nálægt!"],
    wrong: ["Ekki alveg – en nú veistu það.", "Góð tilraun!", "Þessi var snúin."],
    correctAnswer: "Rétt svar:",
    yourAnswer: "Þitt svar:",
    yourGuess: "Þín ágiskun:",
    correctMark: "Rétt svar",
    yourMark: "Þitt svar",
    sources: "Heimildir",
    noSources: "Engin heimild (sýnishorn).",
    reportError: "Tilkynna villu",
    reportSubject: (id: string) => `Villa í spurningu ${id}`,
    reportBody: (id: string) => `Spurning: ${id}\n\nHvað er rangt, og hver er rétta heimildin?\n\n`,
  },
  result: {
    title: "Niðurstöður",
    dailyTitle: (date: string) => `Dagsins próf, ${date}`,
    score: (points: string, max: number) => `${points} af ${max}`,
    headline: (ratio: number) =>
      ratio === 1
        ? "Fullt hús! Glæsilegt."
        : ratio >= 0.7
          ? "Vel gert!"
          : ratio >= 0.4
            ? "Ágætt! Það er alltaf eitthvað nýtt að læra."
            : "Góð byrjun. Skýringarnar hér fyrir neðan hjálpa næst.",
    strongest: "Sterkasta svið:",
    weakest: "Mest að læra:",
    byCategory: "Eftir efnisflokkum",
    review: "Yfirferð",
    outcome: { correct: "Rétt", partial: "Nálægt", wrong: "Rangt" },
    missingQuestion: "Þessi spurning er ekki lengur í boði.",
    backHome: "Aftur á forsíðu",
  },
} as const;

export type Messages = typeof is;
