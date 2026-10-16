# Decisions

Choices made where the brief left room. Newest milestone last. Anything marked **Open** needs a human decision.

## Open questions

- **Open: EU referendum result.** `kerfid-0015` asks only for the date (29 August 2026), as the brief says. A question about the result needs a human to pick the source, for example the ministry's announcement after the vote.
- **Open: Icelandic language review.** The owner will have the UI text (`src/i18n/is.ts`) and the question wording checked before launch.
- **Open: real contact address.** "Tilkynna villu" (`mailto:`) and the About page use `CONTACT_EMAIL` in `src/config.ts`. It is the placeholder `TODO@malamot.is` until the owner supplies an address. Replace it before launch.

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
- **Settings that aren't text live in `src/config.ts`**, starting with `CONTACT_EMAIL`. It is a plain constant, not an environment variable: the site is static, so the address is baked in at build time either way, and a constant is easier to find and change.
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
- **A party registry (`content/parties.json`)** holds letters and names with their source. The validator checks every `parties` entry against it. (Later extended to all 13 parties with flags; see "Party registry" below.)
- **Pseudo-parties `X1`–`X3` for placeholders.** Placeholders never attribute a made-up position or vote to a real party. Verified questions can't use them.
- **Estimate tolerances are fractions of the answer** (0.1 = ±10%), overridable per question. `answer` may not be 0, because a relative tolerance would then accept only an exact hit. (In M2 the owner dropped partial points, so `partialTolerance` was removed; see "Scoring" under M2.)
- **Verified `folkid` questions must have `validUntil`.** The brief says facts that can change should have one, and "who holds which role" always can.
- **`validFrom` and `validUntil` are inclusive** and compared against today's date in Iceland (Atlantic/Reykjavik, UTC+0), not the device's time zone. Everyone sees the same questions on the same day.
- **Expired questions are warnings, not errors.** They are already hidden from players, and CI shouldn't go red just because a date passed. `npm run validate` lists them as needing review.
- **Other warnings:** explanations over 300 characters (the brief asks for 1–2 sentences), a `who_promised` prompt that contains an option's party name, an `accessed` date in the future, and a missing category file. Verified questions still marked `reviewedBy: "pending-human"` are summarised in a single notice.

### Balance report

- **Counts active verified questions only.** Placeholders, expired and not-yet-valid questions are excluded, because players never see them. A question tagged with several parties counts once for each.
- **Average = the category's tagged count summed over the parties, divided by the number of parties.** Since the registry update, only parties with `inBalanceCheck: true` count here. A party is flagged when its count is strictly above 1.5× or strictly below 0.5× the average. Comparing counts to the average is the same as comparing shares to the average share.
- **Categories with no tagged verified questions are reported as "no data"** and not checked. Right now that is `stefna` and `atkvaedi`.

### Seed content

- **Every fact was checked against its source page on 2026-10-15.** All of them matched the brief. althingi.is blocks automated fetchers, so those pages were downloaded and read directly.
- **24 verified questions:** 15 in `kerfid` and 9 in `flokkarnir`. Only the brief's facts were used. Explanations add details from the same source pages: 54 constituency seats and 9 levelling seats, the names of the six constituencies, and the date of the Elections Act (25 June 2021). They started out with `reviewedBy: "pending-human"`. On 2026-10-16 the owner accepted all 34 verified questions (these 24 plus the 10 list-letter questions added later), and `reviewedBy` now carries the owner's name.
- **The 2024 election question names the year** ("alþingiskosningarnar 2024") instead of asking about "the last election", so it stays true after the next election and needs no `validUntil`. The source page is an announcement made before the vote.
- **The 9 list-letter questions used a cyclic design** in which every party was asked about once. They were replaced by 19 questions when the registry grew to 13 parties (see below). All list-letter questions have difficulty 1, so no party is implied to be more obscure than another.
- **12 placeholders**, 3 each in `stefna`, `atkvaedi`, `folkid` and `tolur`, together covering all five question types. The placeholder `folkid` questions have `validUntil: 2027-12-31` as an example.
- **Option order in the files is not final.** In several `kerfid` questions the correct answer is option b. (Settled in M2: the app shuffles options; see below.)

## Party registry (after M1)

Decided by the project owner on 2026-10-15:

- **`content/parties.json` lists all 13 organisations** that hold a list letter on the [Landskjörstjórn page](https://island.is/s/landskjorstjorn/althingiskosningar): B, C, D, F, G, J, L, M, O, P, S, V, Y. Names are spelled exactly as that page lists them. List-letter questions may use any of them.
- **Each party has two required flags.** `inAlthingi` means the party holds seats. `inBalanceCheck` means the balance report includes the party in its averages and warnings. Parties outside the check are still counted and shown in the table, so gaps stay visible.
- **`inBalanceCheck` is true for the six seated parties for now**: B, C, D, F, M, S. More parties will be added when candidate lists for the 2028 election are known.
- **Seats were checked against althingi.is** on 2026-10-15. The [Um þingflokka](https://www.althingi.is/thingmenn/thingflokkar/thingflokkar/) page says six organisations won seats on 30 November 2024: F (10), B (5), M (8), S (15), D (14) and C (11). This matches the owner's list. It also says one MP left Flokkur fólksins in April 2026, which leaves that group with 9. The [Utan þingflokka](https://www.althingi.is/thingmenn/thingflokkar/utan-thingflokka/) page lists two MPs outside any group: Guðmundur Ingi Kristinsson and Jón Gnarr. No seventh parliamentary group exists. The individual group pages are behind a Cloudflare check, so the membership counts per group weren't confirmed beyond the summary page.
- **`shortName` stays an optional field.** It gives a shorter display name where the official name has a subtitle after a dash: "Samfylkingin" and "Lýðræðisflokkurinn". The balance table and the answer options use it.
- **The validator warns if no party has `inBalanceCheck: true`**, because the balance check would then silently check nothing.
- **There are now 19 list-letter questions**, up from 9:
  - **Seated parties:** each is asked about twice, once letter → party and once party → letter, and appears 8 times as an answer option.
  - **Other parties:** each is asked about once and appears 4 times as an option.
  - **Existing questions:** `flokkarnir-0001` to `-0009` keep their subject and direction, but their wrong answers changed.
  - **Answer mix:** every question includes both seated and non-seated wrong answers, and the correct answer's position rotates. The option sets come from a seeded search with those constraints.
  - **Prompt wording:** party → letter prompts use the party's definite form ("Hvaða listabókstaf hefur Framsóknarflokkurinn?"), and G and P (plural names) are only asked letter → party, so the prompt grammar stays simple.
- **The content test now also requires every registered party to be asked about at least once**, so no party gets dropped by accident.

## M2: Playable quiz

### Pages and data flow

- **Routes:** `/` (home), `/dagsins` (daily quiz), `/aefing` (category picker) and `/aefing/<category>` (practice round). The slugs are the category keys. Each category gets its own static page via `generateStaticParams`, and any other path is a 404.
- **The result screen is part of each quiz flow, not a separate route.** The daily result reloads from storage, so `/dagsins` shows it again after a reload.
- **The question bank is built at build time.** It runs through the same `validateContent` as `npm run validate`, so an invalid question never reaches a page, and placeholders are left out unless `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true`. The validated questions are passed to the pages as data, so Zod is not shipped to browsers (checked in the build output).
- **`validFrom`/`validUntil` are applied in the browser**, against today's date in Iceland. A static build can be days old, and a question must still disappear on the right day.
- **Things that depend on the visitor are rendered only in the browser**: today's date and stored progress. The prerendered HTML shows a short "Hleð…" until then. This uses `useSyncExternalStore`, which avoids hydration mismatches and satisfies the React hooks lint rules in this Next.js version.
- **The Forsíða's streak and "Um Málamót" link were left for M3**, together with streaks and the About page, as the brief's milestones split them. (Done in M3.)

### Daily quiz

- **Selection:** the playable questions are sorted by id, shuffled with a PRNG seeded from `daily:<date>` (FNV-1a hash and mulberry32), and the first 7 are taken.
  - **Party rule:** a question is skipped if it concerns a party already picked. If that leaves fewer than 7, skipped questions fill the gaps.
  - **Fairness:** sorting first means the selection depends only on which questions exist, not on file order, so everyone gets the same quiz from the same build.
- **Options are shuffled**, seeded by date and question id, so the order is the same for everyone that day and after a reload. `true_false` questions and questions with `keepOptionOrder: true` keep their file order. `keepOptionOrder` is a new optional field, set on questions whose options are numbers, dates, or Já/Nei/Sat hjá.
- **One attempt per day per device.** The question ids are fixed when the quiz starts, and every answer is saved straight away (`localStorage` key `malamot.daily.v1`, one record per date, the last 400 days kept). A reload continues at the next unanswered question, so a question can't be re-answered by reloading. A record with every question answered counts as finished.
- **The quiz keeps the date it started on.** If the clock passes midnight mid-quiz, the player finishes yesterday's quiz, and today's starts on the next visit.
- **If storage is unavailable, the quiz still works** for that visit. It just isn't remembered, so it can be retaken. (M3 added a visible notice.)
- **If content changes during a day**, questions already chosen for today that no longer exist are dropped from the quiz rather than replaced.

### Scoring

- **Choice questions:** 1 point for the correct option, 0 otherwise.
- **Estimates are full or nothing (owner's decision, 2026-10-15).** A guess within `fullTolerance` of the answer (relative, inclusive, default ±10%) is correct, and anything else is wrong. This departs from the brief's "partial within ±25%". `partialTolerance` was removed from the schema, so the validator rejects it, and the "Nálægt" outcome is gone from the UI. A small epsilon handles floating-point edges such as 63 × 1.1.
- **Scores are whole numbers** ("5 af 7"), and the share card (M3) needs only right and wrong squares.
- **Answers are stored with their outcome and category**, so past results survive later content edits.

### Estimate input

- **Input:** a slider plus a text box for the same number. The slider is keyboard and screen-reader friendly (`aria-valuetext` includes the unit), and the text box accepts Icelandic input such as "1.234,5". The slider starts at the middle of the range.
- **New optional `estimate.step` field:** without it, the step is 1 for whole-number ranges up to 200 wide, otherwise a power of ten giving about 100–1000 steps. The validator rejects an estimate whose answer is not on the slider grid.

### Wording and feedback

- **Results describe knowledge without gendered adjectives.** The brief's example was "Sterk/ur á…". The app uses "Sterkasta svið: Kerfið" and "Mest að læra: Flokkarnir", where the adjective agrees with *svið*, not with the player. Both lines appear only when the categories differ.
- **The encouraging line after an answer rotates by question position**, not at random, so a screen shows the same thing every time it is rendered.
- **Dates and numbers are formatted by hand** (day and month names in `src/i18n/is.ts`). The headless Chromium used for testing has no Icelandic locale data and silently printed "Thursday 15 October", and some real browsers can do the same.

### Practice

- **A round is up to 10 questions** from one category, chosen with the same party rule and a new random seed each time. Practice is not stored.
- **Categories with no playable questions are shown but can't be chosen** ("Engar spurningar enn"). Right now that is stefna, atkvæði, tölur and fólkið, which have only placeholders.

### Testing and tooling

- **End-to-end tests run against the static build**, served by `scripts/serve-static.ts`. It is a small dependency-free server that maps `/aefing` to `aefing.html` the way static hosts do.
- **The tests use a phone-sized Chromium (Pixel 7) only**, with the clock fixed to 2026-10-16. With today's content, that day's quiz includes the estimate question, so both input types are tested; the helpers handle either type if the content changes.
- **Covered:** a full daily quiz, the one-attempt rule, a new quiz the next day, resuming after a reload, and a practice round with replay.
- **Placeholder preview:** a build with placeholders switched on was played through every placeholder category (all five question types, with the SÝNISHORN badge). This was checked by hand, not in CI.
- **CI is pinned to `ubuntu-24.04`.** GitHub moves `ubuntu-latest` to Ubuntu 26 on 2026-10-19, and Playwright's system-dependency install needs a release it supports.
- **Known Next.js 16.4.2 bug on Windows builds only.** Static export writes route prefetch files into nested folders (`aefing/__next.aefing/__PAGE__.txt` instead of `aefing/__next.aefing.__PAGE__.txt`), because it converts only `/` and not `\` in paths. In a Windows build those background prefetches 404 and navigation still works. CI and any Linux-based host produce the correct names, so no workaround was added.

## M3: Polish

### Share card and streak

- **Share text:** `Málamót 15.10. 5/7 🟩🟩🟥🟩🟩🟥🟩`, as in the brief, followed on a second line by the site's address (`window.location.origin`), so whoever receives it can find the quiz. The squares follow the order the questions were asked. The text is built from the stored record alone, so it stays the same even if a question is later removed.
- **Buttons:** "Deila" appears only where the browser has the Web Share API; it falls back to copying if sharing fails for any reason other than the player cancelling. "Afrita" is always there. If the clipboard is blocked too, the player is asked to copy the text, which is shown on screen, by hand.
- **The share card is only on the daily quiz result**, not after practice, since only the daily quiz is the same for everyone.
- **Streak:** the number of days in a row with a completed daily quiz. If today's quiz isn't done yet, it counts from yesterday, so a streak isn't lost before the day is over. A quiz with every question answered counts even if the results screen was never opened.
- **Where the streak shows:** on the home page and on the share card, but not in the shared text, which keeps the brief's format. Without storage there is no history, so no streak is shown.

### Storage

- **Detection:** whether `localStorage` works is tested once per page load with a probe key, and the result is cached. Probing on every render would fire `storage` events in other open tabs.
- **When storage is blocked** (e.g. private mode), the home page and the daily quiz say that results and streaks won't be saved. The quiz is still fully playable, and a reload starts it over.
- **When a save fails although storage works** (e.g. the storage is full), the daily quiz shows a different notice and carries on.

### Pages and states

- **About (`/um`)** covers the brief's §1 principles in plain Icelandic, where questions come from and how they're checked, how to report an error (with `CONTACT_EMAIL`), and privacy. A footer link reaches it from every page.
- **Errors and 404s:** an Icelandic 404 page (`not-found.tsx`, exported as `404.html`) and an error page (`error.tsx`) with "Reyna aftur", using the `retry` prop this Next.js version provides, and a link home.
- **Empty states:** M2 already had them (no questions today, an empty practice category), so they're unchanged.
- **Dark mode follows the system setting** (`prefers-color-scheme`), with no in-app toggle. The colour tokens from M2 were checked in both modes by axe, with no contrast violations.
- **Text wraps anywhere when it has to** (`overflow-wrap: anywhere` on the body), so long party names such as "Lýðræðisflokkurinn – samtök um sjálfsákvörðunarrétt" don't overflow. At 320px wide, no page scrolls sideways.
- **The new M3 strings in `src/i18n/is.ts` are marked as not yet language-reviewed.**

### Accessibility checks

- **`npm run lighthouse`** runs Lighthouse 13's accessibility category, with its default mobile emulation, on `/`, `/dagsins`, `/aefing`, `/aefing/kerfid` and `/um`, and fails if any page scores below 95. All five scored 100. CI runs it with the runner's Chrome.
- **Lighthouse only sees a first visit** (it clears storage), so the end-to-end tests also run axe-core (WCAG 2.2 A/AA rules) in light and dark mode. Covered: the home page before and after playing, an unanswered and an answered question of each input type, the daily and practice results (with a review item expanded), the practice picker, About and the 404 page. Any violation fails the test; there are none.
- **Lighthouse is imported dynamically.** When tsx converts it to CommonJS, it injects a `__name` helper into functions that Lighthouse later runs inside the page, where the helper doesn't exist.

### Tests

- **The no-storage end-to-end test makes `localStorage` throw on access**, as Safari does in private mode. It plays the whole daily quiz and a practice question, and checks that the notice appears, the results and share card work, no streak is shown, and a reload starts over.
- **Sharing is tested both ways:** with a stubbed `navigator.share`, which must receive exactly the text shown, and with sharing absent, where the clipboard must contain the same text. The Windows clipboard turns `\n` into `\r\n`, so the test normalises line endings.
- **The static server now uses `stream.pipeline`.** With `pipe`, an aborted request (e.g. a cancelled prefetch) leaves the file open. A preview server left running for hours stopped answering and made the end-to-end tests time out; leaked file handles are the likely cause, though that wasn't proven.

## M4: Alþingi data prototype

- **The endpoints were found from Alþingi's own index page** (`/altext/xml/`) and checked against live responses on 2026-10-16, as the brief asked. The network was reachable, so the script was written against real data and run live, with trimmed real responses as test fixtures. `docs/althingi-data.md` records the formats and pitfalls.
- **By default the script fetches only totals.** A session's whole vote list, with totals and outcomes, takes one request. How each member and party voted takes one request per vote and per member, so it is fetched only for votes the person asks for (`--votes`, or `--type` with `--limit`). Requests go one at a time with a 1-second pause.
- **The script identifies itself honestly** (`Malamot/0.1 (data prototype; CONTACT_EMAIL)`) rather than posing as a browser. Alþingi's XML endpoints accepted that. If an HTML page (e.g. a Cloudflare check) comes back instead of XML, the script stops with an explanation.
- **Votes are credited to a member's party on the day of the vote,** using the member's seat history, because members change groups within a session. One member moved from Flokkur fólksins to no group on 13 April 2026.
- **Parties are matched by Alþingi group id, never by abbreviation.** Alþingi's own abbreviations clash with list letters: `S` is Sjálfstæðisflokkur in its data. The ids live in `content/parties.json` (`althingiGroupIds`, sourced from Alþingi's group list), and the validator rejects an id claimed by two parties. Members with no matching party are counted under their group's name, e.g. "utan þingflokka".
- **Every detailed vote is cross-checked:** the member list must add up to the published totals, and any mismatch is written to the output under `checks`. Both votes fetched live matched.
- **Unknown values stop the parser,** whether a vote value, outcome or date format. Alþingi says the format can change without notice, and silently mislabelling a vote would be worse than failing.
- **No "final vote" filter.** The filter is by Alþingi's raw type code (`--type lg`). That `lg` is the vote on a bill as a whole is only inferred, so it is stated in the docs rather than built into the tool.
- **Output goes to `content/raw/althingi-votes-<session>.json` and is not committed** (it is about 1 MB for one session, and anyone can regenerate it). Re-running keeps member-level details fetched earlier. The app and the validator never read `content/raw/`.
- **No questions are created.** CONTENT_GUIDE.md now has a section on turning a vote into a `vote_record` question by hand, including when *not* to ask how a party voted (when its members split).
- **`fast-xml-parser`** was added as a dev dependency for the script. The app doesn't use it.
- **`boðaði fjarvist`** (a notified absence) is handled because Alþingi's XML comments document it, but none of the downloaded votes contained one. It is tested with a clearly labelled synthetic example rather than a made-up fixture.
- **Side finding:** Jón Gnarr's official seat record shows him in Viðreisn's group without a break from November 2024 to now, although Alþingi's "utan þingflokka" page lists him among members who "have been" outside a group. The seat data is what the script uses.
