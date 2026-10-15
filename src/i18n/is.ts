// All user-facing text lives here so an English translation can be added later
// (en.ts with the same shape). Code and identifiers stay in English.

import type { Category, QuestionType } from "../lib/content/constants";

/** Icelandic count agreement: 1, 21, 31… take singular, except 11, 111, etc. */
function plural(n: number, one: string, many: string): string {
  return n % 10 === 1 && n % 100 !== 11 ? one : many;
}

const categories: Record<Category, { name: string; description: string }> = {
  kerfid: {
    name: "Kerfið",
    description: "Kosningakerfið, Alþingi, forsetinn og stjórnarmyndun",
  },
  flokkarnir: {
    name: "Flokkarnir",
    description: "Stjórnmálaflokkar, formenn þeirra og listabókstafir",
  },
  stefna: {
    name: "Stefnan",
    description: "Stefnumál flokkanna og kosningaloforð",
  },
  atkvaedi: {
    name: "Atkvæðagreiðslur",
    description: "Hvernig þingmenn greiddu atkvæði á Alþingi",
  },
  tolur: {
    name: "Tölurnar",
    description: "Fjárlög, kjörsókn, þingsæti og fleira",
  },
  folkid: {
    name: "Fólkið",
    description: "Stjórnmálafólk og embættin sem það gegnir",
  },
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
      "Daglegt spurningapróf um íslensk stjórnmál: flokkana, stefnumálin, atkvæðagreiðslur og kosningakerfið. Hverju svari fylgir útskýring og heimild.",
    skipToContent: "Fara beint í efnið",
    noScript: "Málamót þarf JavaScript til að virka.",
    loading: "Hleður…",
  },

  categories,
  questionTypes,

  // Explicit names because some browsers lack Icelandic locale data.
  dates: {
    weekdays: [
      "sunnudagur",
      "mánudagur",
      "þriðjudagur",
      "miðvikudagur",
      "fimmtudagur",
      "föstudagur",
      "laugardagur",
    ],
    months: [
      "janúar",
      "febrúar",
      "mars",
      "apríl",
      "maí",
      "júní",
      "júlí",
      "ágúst",
      "september",
      "október",
      "nóvember",
      "desember",
    ],
  },

  home: {
    intro:
      "Spurningar um stjórnmálaflokkana, stefnumálin, atkvæðagreiðslur og kosningakerfið. Hverju svari fylgir útskýring og heimild.",
    dailyTitle: "Dagsins próf",
    dailyHint: "Sjö spurningar, þær sömu fyrir alla.",
    takeDaily: "Taka dagsins próf",
    continueDaily: (answered: number, total: number) =>
      `Halda áfram (${answered} af ${total})`,
    dailyDone: (score: string, total: number) =>
      `Þú fékkst ${score} af ${total} mögulegum stigum. Nýtt próf bíður þín á morgun.`,
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
    intro:
      "Veldu efnisflokk og svaraðu allt að tíu spurningum í handahófskenndri röð. Þú getur æft þig eins oft og þú vilt.",
    questionCount: (n: number) =>
      `${n} ${plural(n, "spurning", "spurningar")}`,
    noQuestions: "Engar spurningar enn sem komið er",
    empty: "Engar spurningar eru enn í boði í þessum flokki.",
    playAgain: "Æfa aftur",
    otherCategory: "Velja annan flokk",
  },

  question: {
    progress: (n: number, total: number) =>
      `Spurning ${n} af ${total}`,
    placeholderBadge: "SÝNISHORN",
    placeholderNote: "Þetta er sýnishorn, ekki raunveruleg spurning.",
    submit: "Svara",
    next: "Næsta spurning",
    seeResults: "Sjá niðurstöður",
    estimateLabel: "Þín ágiskun",
    estimateNumberLabel: "Eða sláðu inn tölu",
    estimateRange: (min: string, max: string) =>
      `Frá ${min} til ${max}`,
  },

  feedback: {
    correct: [
      "Rétt!",
      "Vel gert!",
      "Alveg rétt!",
    ],
    wrong: [
      "Ekki alveg – en nú veistu það.",
      "Góð tilraun!",
      "Þessi var snúin.",
    ],
    correctAnswer: "Rétt svar:",
    yourAnswer: "Þitt svar:",
    yourGuess: "Þín ágiskun:",
    correctMark: "Rétt svar",
    yourMark: "Þitt svar",
    sources: "Heimildir",
    noSources: "Engar heimildir (sýnishorn).",
    opensInNewTab: "(opnast í nýjum flipa)",
    reportError: "Tilkynna villu",
    reportSubject: (id: string) =>
      `Villa í spurningu ${id}`,
    reportBody: (id: string) =>
      `Spurning: ${id}\n\nHvað er rangt við spurninguna eða svarið? Láttu rétta heimild fylgja ef þú getur.\n\n`,
  },

  result: {
    title: "Niðurstöður",
    dailyTitle: (date: string) =>
      `Dagsins próf – ${date}`,
    score: (points: string, max: number) =>
      `${points} af ${max}`,
    outOf: (max: number) =>
      ` af ${max}`,
    headline: (ratio: number) =>
      ratio === 1
        ? "Fullt hús! Glæsilega gert!"
        : ratio >= 0.7
          ? "Vel gert!"
          : ratio >= 0.4
            ? "Ágætis árangur! Það er alltaf eitthvað nýtt að læra."
            : "Góð byrjun! Skoðaðu skýringarnar hér fyrir neðan og reyndu aftur.",
    strongest: "Sterkasta svið:",
    weakest: "Mest svigrúm til að bæta sig:",
    byCategory: "Árangur eftir efnisflokkum",
    review: "Yfirferð",
    outcome: {
      correct: "Rétt",
      wrong: "Rangt",
    },
    missingQuestion: "Þessi spurning er ekki lengur í boði.",
    backHome: "Aftur á forsíðu",
  },
} as const;

export type Messages = typeof is;
