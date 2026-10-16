# Content guide

For everyone who writes or reviews Málamót questions. The app only works if players can trust it, and they will only trust it if every question is accurate, sourced and fair to every party.

## The ground rules

1. **Every question has a source and an explanation.** A verified question without both will not validate and will not reach players.
2. **Test knowledge, never opinion.** Ask what a party proposed or how a vote went. Never ask whether a policy is good, and never imply it.
3. **Treat every party the same way.** Similar numbers of questions, the same tone, comparable difficulty. `npm run balance` measures the first of these. The other two depend on you.
4. **No facts from memory.** Check every fact against its source on the day you write the question.

## Writing neutrally

| Instead of | Write |
|---|---|
| "Hvaða flokkur vill hækka skatta á almenning?" | "Hvaða flokkur lagði til að tekjuskattur í efsta þrepi yrði hækkaður í [X]%?" |
| "Hvaða flokkur stöðvaði [mál]?" | "Hvernig greiddi þingflokkur [flokks] atkvæði um [mál]?" |
| Adjectives such as *umdeildur*, *róttækur*, *misheppnaður* | Leave them out. Describe what happened. |

- **Use the party's own terms, or a plain paraphrase.** Don't use an opponent's framing or nicknames for a policy.
- **Pick quotes fairly.** If a party's platform says ten things, don't pick the one that sounds strangest. Ask yourself whether you would choose the equivalent quote for every other party.
- **Anonymise `who_promised` prompts.** Remove the party's name, its leader's name, slogans and anything else that gives the answer away. The validator warns if the prompt contains a party name, but it can't spot everything.
- **Keep wrong answers plausible and respectful.** Never write a wrong answer as a joke at the expense of a party, a politician or the player.
- **Write explanations to inform, not to judge.** One or two sentences: the fact, and enough context to make it stick. Don't start with "Rétt!" or "Rangt!", because the app already shows that.
- **Write in balanced sets where you can.** For example, one `stefna` question per party on the same topic (housing, health, EU). That keeps the balance even and makes each question easier to check for fairness.

## The party registry

`content/parties.json` lists every organisation that holds a list letter on the Landskjörstjórn page, spelled exactly as that page spells it. Each party has:

| Field | Meaning |
|---|---|
| `letter`, `name` | As Landskjörstjórn lists them |
| `shortName` | Optional shorter display name, e.g. "Samfylkingin" |
| `inAlthingi` | The party holds seats in Alþingi |
| `inBalanceCheck` | `npm run balance` includes the party in its averages and warnings |

Questions may refer to any party in the registry. The balance check only covers parties with `inBalanceCheck: true`. That is currently the six parties with seats; more will be added when candidate lists for the 2028 election are known. Parties outside the check still show up in the balance table, so you can see which ones have few questions.

When a party registers, dissolves, wins or loses seats, update the registry and its `sources` in the same pull request. List-letter questions about a party that has dissolved should get a `validUntil`.

## Choosing sources

Use primary sources whenever they exist:

1. **althingi.is**: votes, bills, parliamentary documents, the law collection (lagasafn), members.
2. **island.is**: Landskjörstjórn, elections, official services.
3. **stjornarradid.is**: government, ministries, announcements, the budget.
4. **hagstofa.is** (Hagstofa Íslands): turnout, results and other statistics.
5. **Parties' own platforms and websites**, for `stefna` questions.

News media (RÚV and others) can add context, but should not be the only source for a fact that a primary source covers.

For each source, record:

- `title`: the page title as it appears on the page
- `url`: a direct link to the page that states the fact, not a home page
- `accessed`: the date you checked it (YYYY-MM-DD)

Party platforms change and disappear. For `stefna` questions, also save the page in the Internet Archive (web.archive.org) and add the archived URL as a second source.

## Facts that change

Some facts are only true for a while: who holds an office, who leads a party, how many seats a party has.

- **Set `validUntil`** to the last day you are confident the fact holds. That is usually the next scheduled event (an election, a party congress), or a review date at most about a year away. On the day after `validUntil`, the question disappears from the app and `npm run validate` lists it as needing review.
- `folkid` questions **must** have `validUntil`. The validator enforces this for verified questions.
- **Anchor questions in time where possible**, so they never expire. "Hvaða dag fóru alþingiskosningarnar 2024 fram?" stays true forever. "Hvenær voru síðustu kosningar?" does not.
- Use `validFrom` to schedule a question that should not appear before a certain date.

## Question types

| `type` | Name in the app | Rules |
|---|---|---|
| `multiple_choice` | Krossaspurning | 3–4 options, one correct |
| `who_promised` | Hver lofaði þessu? | Option ids are party letters from `content/parties.json`. At least 3 options (the correct party and at least two others). `parties` must include the correct party. |
| `vote_record` | Hvernig var kosið? | 2–4 options, e.g. "Samþykkt"/"Fellt", or "Já"/"Nei"/"Sat hjá" |
| `estimate` | Ágiskun | No options. An `estimate` block instead (see below). |
| `true_false` | Satt eða ósatt | Exactly two options, `{"id": "true", "text": "Satt"}` then `{"id": "false", "text": "Ósatt"}` |

### Estimate questions

```json
"estimate": { "answer": 63, "min": 20, "max": 120, "unit": "þingsæti", "fullTolerance": 0 }
```

- `min` and `max` are the ends of the slider. Keep the answer away from both ends so the range doesn't give it away.
- Estimates are right or wrong, with no partial points. A guess within `fullTolerance` of the answer is right. The tolerance is a fraction of the answer: `0.1` (the default) means ±10%, and `0` means only the exact number counts.
- Use tight tolerances (or 0) for exact facts like seat counts, and for percentages, where ±10% of 80% is already 72–88%.
- `step` sets how far the slider moves at a time. Without it, the step is 1 for whole-number ranges up to 200 wide, and a round power of ten for wider ranges (10 for 0–3000). The answer must land exactly on a step, or the validator rejects the question; with an exact-answer question, players couldn't hit it otherwise.
- The slider starts in the middle of the range.

## Fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `<category>-<four digits>`, e.g. `kerfid-0016`. Never reuse an id. When you remove a question, add its id to `content/retired-ids.json`. |
| `type`, `category` | yes | The category must match the file the question is in. |
| `status` | yes | `placeholder` or `verified` (see the review steps below). |
| `difficulty` | yes | 1 (most people know this), 2, or 3 (specialist). |
| `prompt` | yes | Icelandic. |
| `options`, `correctOptionId` | all types except `estimate` | Option ids are short and stable (`a`, `b`, …, or party letters). The app shuffles the options, so their order in the file doesn't matter. |
| `keepOptionOrder` | optional | Set to `true` when the options have a natural order that shuffling would make confusing: numbers, dates, or "Já / Nei / Sat hjá". `true_false` is never shuffled. |
| `estimate` | `estimate` only | |
| `explanation` | yes | One or two sentences, Icelandic, neutral. |
| `sources` | yes | At least one for verified questions. |
| `parties` | when the question concerns a party | Party letters, e.g. `["S", "D"]`. This drives the balance report, so tag every question that is about a specific party. |
| `validFrom`, `validUntil` | when needed | ISO dates, inclusive. |
| `reviewedBy` | verified only | The name of the person who checked the question against its sources. |

## Placeholders

Placeholders show the format and mark the gaps a human needs to fill. They:

- have `status: "placeholder"` and may have empty `sources`,
- use bracketed text such as `[Flokkur X] hefur lagt til [stefnumál]`, so nobody mistakes them for facts,
- use the pseudo-parties `X1`, `X2`, `X3` instead of real party letters (verified questions can't use these),
- are never shown to players, only in local previews with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true`.

## Review steps

1. **Write**: add the question with `status: "placeholder"`, or replace a placeholder's content with the real question.
2. **Check**: a second person opens every source and confirms the prompt, the correct answer, every wrong answer and the explanation. They also read it for neutrality using the checklist below.
3. **Sign off**: the reviewer sets `status: "verified"` and `reviewedBy` to their name.
4. **Run** `npm run validate` and `npm run balance`, then open a pull request. CI must be green. Balance warnings don't block a merge, but they do need a plan, such as questions for the under-represented parties.

The seed questions were written by the coding agent from official pages, then signed off by the project owner. For questions the agent writes later, the same applies: they start with `reviewedBy: "pending-human"`, and a person checks each one and replaces that value with their name. `npm run validate` lists how many are still pending.

### Neutrality checklist for reviewers

- Would this question read the same if it were about a different party?
- Is anything in the prompt, the options or the explanation loaded, mocking or judgemental?
- Does the explanation state facts that are in the sources, and nothing else?
- For `who_promised`: can you tell the answer from the wording alone?
- Is the party tagged in `parties`?
