// All user-facing text lives here so an English translation can be added later
// (en.ts with the same shape). Code and identifiers stay in English.

export const is = {
  app: {
    name: "Málamót",
    tagline: "Hvað veistu um íslensk stjórnmál?",
    description:
      "Daglegt próf um íslensk stjórnmál: flokkana, stefnumálin, atkvæðagreiðslur og kosningakerfið. Hverju svari fylgir útskýring og heimild.",
  },
  home: {
    comingSoon: "Í smíðum. Fyrsta prófið kemur bráðum.",
  },
} as const;

export type Messages = typeof is;
