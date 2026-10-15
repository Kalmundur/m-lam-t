# Decisions

Choices made where the brief left room. Newest milestone last. Anything marked **Open** needs a human decision.

## Open questions

- **Open: list letters.** The brief lists 9 parties. The [Landskjörstjórn page](https://island.is/s/landskjorstjorn/althingiskosningar) (checked 2026-10-15) lists 13 organisations with a list letter: the brief's 9, plus G (Græningjar stjórnmálasamtök), L (Lýðræðisflokkurinn – samtök um sjálfsákvörðunarrétt), O (Frjálslyndi lýðræðisflokkurinn) and Y (Ábyrg framtíð). `content/parties.json` contains only the brief's 9 for now. Adding the other 4 would make the balance report expect equal coverage of them too. Which set should the app treat as "the parties"?
- **Open: EU referendum result.** `kerfid-0015` asks only for the date (29 August 2026), as the brief says. A question about the result needs a human to pick the source, for example the ministry's announcement after the vote.
- **Open: contact address** for "Tilkynna villu" (`mailto:`) and the About page. Needed in M2.

## M1: Skeleton

### Stack and tooling

- **Next.js 16.4 static export (`output: "export"`).** create-next-app 16 enables `cacheComponents` and `partialPrefetching` by default. Static export rejects both ("PPR cannot be enabled in export mode"), so they are off. Nothing in v1 needs a server.
- **Node 24** (`.nvmrc`). Vitest 5 needs Node `^22.12 || >=24`, so `engines` says that, and `@types/node` is at 24.
- **Scripts run with `tsx`** and import the same TypeScript modules as the app (`src/lib/content/`). Scripts read paths relative to the working directory, which `npm run` sets to the repo root.
- **`npm run build` runs `validate` first** (`prebuild`), so a deploy from any host fails on invalid content. CI calls `next build` directly to avoid validating twice.
- **CI uses `actions/checkout@v5` and `actions/setup-node@v5`.** Balance warnings and validation issues are emitted as GitHub annotations, and both scripts write a table to the job summary. The first run on GitHub (Kalmundur/m-lam-t) passed.
- **`npm audit` reports 5 "high" findings.** They all come from one advisory in `braces`, pulled in through `eslint-config-next` → `fast-glob` → `micromatch`. This is dev-only lint tooling and never ships. `npm audit fix --force` would downgrade `eslint-config-next` to v14, so it's left alone until upstream updates.
- **The AGENTS.md from create-next-app is kept.** `next dev` regenerates it anyway.
- **UI strings live in `src/i18n/is.ts`** as a typed object. No i18n library yet; an `en.ts` with the same shape can be added later.
- **Script output is in English.** It is developer tooling, and the brief puts code in English. Everything players see is in Icelandic.
- **M1 was committed straight to `main`**, because the repository was new. Later work goes on branches with pull requests, so CI runs before merging.

### Schema and validation

- **Sources may be empty on placeholders.** The brief's schema comment says "at least 1", but §8 asks for placeholders with empty `sources`. The schema requires at least one source, plus `reviewedBy`, only when `status` is `verified`. Placeholders never reach players unless `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true`.
- **Validation is split in two.** Rules about a single question live in the Zod schema (`schema.ts`), so the app can apply the same checks when loading. Rules that need the whole set or the party registry live in `validate.ts`: unique ids, file/category match, known party letters, retired ids.
- **Unknown fields are errors** (strict objects), so typos such as `explaination` are caught.
- **Id format** is `^[a-z]+-\d{4}$`. An id whose prefix doesn't match its category is a warning, not an error, so a question can move category without changing its id.
- **"Never reuse an ID" is enforced** through `content/retired-ids.json`. Deleted ids go there, and the validator rejects any question that uses one.
- **Option rules per type:** `multiple_choice` 3–4. `who_promised` at least 3, with no upper limit, and option ids must be registered party letters. `vote_record` 2–4. `true_false` exactly two options with ids `true` and `false`, in that order. Option ids and texts must be unique within a question.
- **`who_promised` must tag the correct party in `parties`.** Otherwise the balance report could not count it.
- **A party registry (`content/parties.json`)** holds letters and names with their source. The validator checks every `parties` entry against it, and the balance report uses it as the list of parties.
- **Pseudo-parties `X1`–`X3` for placeholders.** Placeholders never attribute a made-up position or vote to a real party. Verified questions can't use them.
- **Estimate tolerances are fractions of the answer** (0.1 = ±10%). The defaults are 0.1 for full points and 0.25 for partial points, and can be overridden per question. `answer` may not be 0, because relative tolerances would then accept only an exact hit. `fullTolerance` may not exceed `partialTolerance`.
- **Verified `folkid` questions must have `validUntil`.** The brief says facts that can change should have one, and "who holds which role" always can.
- **`validFrom` and `validUntil` are inclusive** and compared against today's date in Iceland (Atlantic/Reykjavik, UTC+0), not the device's time zone. Everyone sees the same questions on the same day.
- **Expired questions are warnings, not errors.** They are already hidden from players, and CI shouldn't go red just because a date passed. `npm run validate` lists them as needing review.
- **Other warnings:** explanations over 300 characters (the brief asks for 1–2 sentences), a `who_promised` prompt that contains an option's party name, an `accessed` date in the future, and a missing category file. Verified questions still marked `reviewedBy: "pending-human"` are summarised in a single notice.

### Balance report

- **Counts active verified questions only.** Placeholders, expired and not-yet-valid questions are excluded, because players never see them. A question tagged with several parties counts once for each.
- **Average = the category's tagged count summed over all registered parties, divided by the number of parties.** A party is flagged when its count is strictly above 1.5× or strictly below 0.5× the average. Comparing counts to the average is the same as comparing shares to the average share.
- **Categories with no tagged verified questions are reported as "no data"** and not checked. Right now that is `stefna` and `atkvaedi`.

### Seed content

- **Every fact was checked against its source page on 2026-10-15.** All of them matched the brief. althingi.is blocks automated fetchers, so those pages were downloaded and read directly.
- **24 verified questions:** 15 in `kerfid` and 9 in `flokkarnir`. Only the brief's facts were used. Explanations add details from the same source pages: 54 constituency seats and 9 levelling seats, the names of the six constituencies, and the date of the Elections Act (25 June 2021). All 24 have `reviewedBy: "pending-human"`.
- **The 2024 election question names the year** ("alþingiskosningarnar 2024") instead of asking about "the last election", so it stays true after the next election and needs no `validUntil`. The source page is an announcement made before the vote.
- **Party letters use a cyclic design.** Question *i* offers parties *i, i+2, i+5, i+7* (mod 9). Every party is the subject of exactly one question and appears exactly 4 times as an option. Five questions go letter → party and four go party → letter. All have difficulty 1, so no party is implied to be more obscure than another.
- **12 placeholders**, 3 each in `stefna`, `atkvaedi`, `folkid` and `tolur`, together covering all five question types. The placeholder `folkid` questions have `validUntil: 2027-12-31` as an example.
- **Option order in the files is not final.** In several `kerfid` questions the correct answer is option b. M2 will decide whether to shuffle options when the quiz is shown.
