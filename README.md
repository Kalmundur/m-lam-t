# Málamót

A mobile-first quiz that tests how much you know about Icelandic politics: the parties, what they promise, how they vote, who holds which role, and how the electoral system works. Every answer comes with a short explanation and a source.

Málamót is a knowledge quiz, not a vote matcher. It never tells players which party they agree with, never scores or ranks parties, and never asks for anyone's opinions. See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for the neutrality rules.

## Status

| Milestone | State |
|---|---|
| M1 Skeleton: stack, schema, validator, balance report, CI, seed content | done |
| M2 Playable quiz: daily quiz, practice, all question types | not started |
| M3 Polish: share card, streaks, About page, accessibility | not started |
| M4 Alþingi open-data prototype | not started |

## Running it

Requires Node 24 (see `.nvmrc`; 22.12+ also works).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Validates content, then builds the static site into `out/` |
| `npm run validate` | Checks every question file; exits non-zero on any error |
| `npm run balance` | Prints how many verified questions concern each party, per category |
| `npm test` | Unit tests (Vitest), including a check of the real content |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

`validate` and `balance` accept `-- --today YYYY-MM-DD` to see what will have expired by a given date.

The build is a plain static site with no server. Any static host can serve `out/`; none is wired up yet.

### Placeholders

Only `verified` questions are shown to players. To preview placeholder questions locally (marked with a "SÝNISHORN" badge, from M2):

```bash
NEXT_PUBLIC_SHOW_PLACEHOLDERS=true npm run dev
```

Never set this in production.

## Adding a question

1. Open the file for its category in `content/questions/` (`kerfid`, `flokkarnir`, `stefna`, `atkvaedi`, `tolur`, `folkid`).
2. Give it the next free id in that file, e.g. `stefna-0004`. Never reuse an id; when you delete a question, add its id to `content/retired-ids.json`.
3. Fill in the fields described in [CONTENT_GUIDE.md](CONTENT_GUIDE.md), with `status: "placeholder"` until a second person has checked it against the source.
4. Run `npm run validate` and `npm run balance`.
5. Open a pull request. CI must be green.

## Project layout

```
content/
  questions/<category>.json   question data, one file per category
  parties.json                party registry (list letters) used by validation and the balance report
  retired-ids.json            ids that must never be used again
scripts/
  validate.ts                 npm run validate
  balance-report.ts           npm run balance
src/
  app/                        Next.js App Router pages
  config.ts                   project settings, e.g. CONTACT_EMAIL (placeholder TODO@malamot.is)
  i18n/is.ts                  all Icelandic UI text
  lib/content/                Zod schema, validation, availability and balance logic (shared by app and scripts)
.github/workflows/ci.yml      validate (fails), balance (warns), typecheck, lint, test, build
```

## Continuous integration

On every push to `main` and on pull requests, CI:

- **fails** if any question is invalid,
- **warns**, without failing, when a party's share of verified questions in `stefna`, `atkvaedi` or `flokkarnir` is above 1.5× or below 0.5× the category average,
- runs typecheck, lint, unit tests and the static build.

The balance table also appears in the job summary.

## More

- [CONTENT_GUIDE.md](CONTENT_GUIDE.md): how to write, source and review questions
- [DECISIONS.md](DECISIONS.md): choices made where the brief left room
