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

  // Added in M3; not yet language-reviewed.
  streak: (n: number) => `${n} ${plural(n, "dagur", "dagar")} í röð`,

  storage: {
    unavailable:
      "Vafrinn þinn leyfir ekki vistun gagna, svo niðurstöður og dagaröð geymast ekki. Þú getur samt tekið prófið.",
    saveFailed:
      "Ekki tókst að vista framvinduna. Þú getur klárað prófið, en niðurstaðan gleymist þegar þú lokar síðunni.",
  },

  share: {
    title: "Deildu niðurstöðunni",
    hint: "Textinn sýnir ekki svörin, svo þú spillir engu fyrir öðrum.",
    text: (date: string, points: number, max: number, squares: string) =>
      `Málamót ${date} ${points}/${max} ${squares}`,
    share: "Deila",
    copy: "Afrita",
    copied: "Afritað!",
    copyFailed: "Ekki tókst að afrita. Veldu textann og afritaðu hann handvirkt.",
  },

  nav: {
    about: "Um Málamót",
  },

  about: {
    title: "Um Málamót",
    intro:
      "Málamót er spurningaleikur um íslensk stjórnmál. Markmiðið er að hjálpa fólki að læra meira um flokkana, stefnumál þeirra, atkvæðagreiðslur á Alþingi og hvernig kosningakerfið virkar.",
    neutralityTitle: "Hlutleysi",
    neutrality: [
      "Málamót segir þér aldrei hvaða flokk þú ættir að kjósa eða hvaða flokki þú ert sammála.",
      "Flokkum er hvorki gefin einkunn né raðað eftir ágæti.",
      "Við spyrjum aldrei um skoðanir þínar. Niðurstaðan lýsir aðeins þekkingu þinni.",
      "Spurningar sem varða tiltekinn flokk eru merktar honum. Sjálfvirk athugun telur hversu margar spurningar varða hvern flokk á Alþingi og varar við ef einhver flokkur fær mun meiri eða minni athygli en hinir.",
      "Í dagsins prófi eru ekki tvær spurningar um sama flokk ef hægt er að komast hjá því.",
    ],
    sourcesTitle: "Hvaðan koma spurningarnar?",
    sources: [
      "Hverri spurningu fylgir stutt útskýring og heimild sem þú getur skoðað.",
      "Við notum frumheimildir þegar þær eru til: althingi.is, island.is, stjornarradid.is, Hagstofu Íslands og stefnuskrár flokkanna sjálfra.",
      "Hver spurning er borin saman við heimildina áður en hún birtist.",
      "Staðreyndir sem geta breyst, til dæmis hver gegnir embætti, fá gildistíma. Þegar hann rennur út hverfur spurningin þar til hún hefur verið yfirfarin aftur.",
    ],
    reportTitle: "Fannstu villu?",
    report:
      "Undir hverri spurningu er hlekkurinn „Tilkynna villu“. Hann opnar tölvupóst þar sem auðkenni spurningarinnar er þegar komið inn. Þú getur líka skrifað okkur beint:",
    privacyTitle: "Persónuvernd",
    privacy: [
      "Málamót notar hvorki notendaaðganga, vafrakökur né vefmælingar.",
      "Svör þín, niðurstöður og dagaröð eru aðeins geymd í vafranum þínum og eru aldrei send neitt.",
    ],
  },

  notFound: {
    title: "Síðan fannst ekki",
    text: "Þessi síða er ekki til. Kannski er slóðin vitlaus.",
  },

  error: {
    title: "Eitthvað fór úrskeiðis",
    text: "Villa kom upp þegar síðan var birt.",
    retry: "Reyna aftur",
  },
} as const;

export type Messages = typeof is;
