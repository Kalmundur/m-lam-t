# Alþingi open data: what's there and how Málamót uses it

Alþingi publishes parliamentary data as XML at **https://www.althingi.is/altext/xml/**. Everything below was checked against live responses on **2026-10-16**. Nothing here is assumed from older documentation. `scripts/fetch-votes.ts` uses the endpoints marked *used*.

## Ground rules from Alþingi

The index page (`/altext/xml/`, in Icelandic) says:

- There is **no XML schema** for the data, except for Alþingistíðindi.
- The **format can change without notice**, and data may move between files.
- Data is **updated about once a day**.
- **Some files are large.** A session's speech list can be several MB, and the vote list for the 157th session is 1.9 MB.

Practical notes from using it:

- **No API key or login.** Plain `GET` requests work.
- **The XML endpoints answered** both a browser user agent and an honest one (`Malamot/0.1 (data prototype; …)`). Some HTML pages on althingi.is sit behind a Cloudflare check, and the script detects an HTML reply and stops with a message instead of parsing it.
- **The XML is UTF-8**, but the index page itself is ISO-8859-1.
- **Element and attribute names are Icelandic** (`<atkvæðagreiðsla>`, `þingnúmer`), and attributes use single quotes.
- **Dates come in two formats:** ISO (`2026-03-19T11:31:54`, Icelandic local time, which is UTC) in vote data, and `dd.mm.yyyy` in session and seat data.

## Endpoints

| Endpoint | Content | Used |
|---|---|---|
| `loggjafarthing/yfirstandandi/` | The current session (löggjafarþing), with links to its lists | used, when no `--session` is given |
| `loggjafarthing/` | Every session since 1875, with dates and links | |
| `atkvaedagreidslur/?lthing=N` | Every vote in session N with totals and outcome. The index also offers `&malnr=` (one issue) and listing by date or the last 100 days. | used |
| `atkvaedagreidslur/atkvaedagreidsla/?numer=N` | One vote, with how each member voted | used, for selected votes |
| `thingmenn/thingmadur/thingseta/?nr=N` | One member's seats: session, parliamentary group, constituency, dates | used, to find a member's party on the day of a vote |
| `thingmenn/?lthing=N` | Members in session N (name, birth date, links), with **no party** | |
| `thingflokkar/` and `thingflokkar/?lthing=N` | Parliamentary groups: id, name, abbreviations, first and last session | used once, to fill `althingiGroupIds` in `content/parties.json` |
| `thingmalalisti/thingmal/?lthing=N&malnr=M` | One issue (þingmál) and its course | |

The index also lists speeches, documents, committees, agendas, ministers and more. None of them are used yet.

## Vote list: `atkvaedagreidslur/?lthing=157`

One `<atkvæðagreiðsla>` per vote. In the 157th session there were 1,744:

```xml
<atkvæðagreiðsla málsnúmer='114' þingnúmer='157' málsflokkur='A' atkvæðagreiðslunúmer='69251'>
  <mál málsnúmer='114' þingnúmer='157' málsflokkur='A'>
    <málsheiti>veitingastaðir, gististaðir og skemmtanahald</málsheiti>
    <html>https://www.althingi.is/thingstorf/thingmalalistar-eftir-thingum/ferill/?ltg=157&amp;mnr=114</html>
    <xml>…/thingmalalisti/thingmal/?lthing=157&amp;malnr=114</xml>
  </mál>
  <tími>2026-03-19T11:31:54</tími>
  <fundur>86</fundur>
  <tegund tegund='lg'>Frv.</tegund>
  <þingskjal skjalsnúmer='692' þingnúmer='157'>…</þingskjal>
  <samantekt>
    <aðferð>atkvæðagreiðslukerfi</aðferð>
    <já><fjöldi>31</fjöldi></já>
    <nei><fjöldi>23</fjöldi></nei>
    <greiðirekkiatkvæði><fjöldi>0</fjöldi></greiðirekkiatkvæði>
    <afgreiðsla>samþykkt</afgreiðsla>
  </samantekt>
  <nánar>
    <html>https://www.althingi.is/dba-bin/atkvgr.pl?nnafnak=69251</html>
    <xml>…/atkvaedagreidslur/atkvaedagreidsla/?numer=69251</xml>
  </nánar>
</atkvæðagreiðsla>
```

- **`aðferð`** (method) takes three values. In the 157th session:
  - `atkvæðagreiðslukerfi`: electronic voting (1,207).
  - `nafnakall`: roll call (7).
  - `yfirlýsing forseta/mál gengur`: the Speaker declares the motion passed (530). These have **no totals, outcome or member list**.
- **`afgreiðsla`** (outcome) is `samþykkt` or `Fellt`; note the capital F. The script lower-cases it.
- **`málsflokkur`**: `A` for issues with parliamentary documents, `B` for others.
- **`tegund`** has a code and a label. No official list of codes was found. The most common in the 157th session:

  | Code | Label | Count |
  |---|---|---|
  | `bt` | Brtt. (amendment) | 478 |
  | `gr` | Þskj. | 466 |
  | `v2` | Frv. gengur til 2. umr. | 147 |
  | `n2` | Frv. gengur | 138 |
  | `v3` | Frv. gengur til 3. umr. | 105 |
  | `lg` | Frv. | 105 |
  | `vs` | Till. gengur til síðari umr. | 57 |
  | `ns` | Till. gengur | 56 |
  | `tg` | Tillgr. | 47 |
  | `as` | Of skammt var liðið frá útbýtingu --- Afbrigði | 35 |
  | `þa` | Till. | 22 |

  `lg` appears to be the vote on a bill as a whole. That is **an inference**: there are exactly as many `lg` votes as `v3` ("to 3rd reading") votes, and Alþingi's own page for such a vote just says "Frv.". Check the vote page before relying on it.

## One vote: `atkvaedagreidslur/atkvaedagreidsla/?numer=69066`

```xml
<atkvæðagreiðsla málsnúmer='…' þingnúmer='157' atkvæðagreiðslunúmer='69066' málsflokkur='A'>
  <mál …>…</mál><tími>2026-02-02T17:59:28</tími> …
  <niðurstaða>
    <aðferð>atkvæðagreiðslukerfi</aðferð>
    <já><fjöldi>32</fjöldi></já>
    <nei><fjöldi>11</fjöldi></nei>
    <greiðirekkiatkvæði><fjöldi>9</fjöldi></greiðirekkiatkvæði>
    <niðurstaða>samþykkt</niðurstaða>
  </niðurstaða>
  <atkvæðaskrá>
    <þingmaður id='1510'><nafn>Alma D. Möller</nafn><atkvæði>já</atkvæði><xml>…</xml></þingmaður>
    …
  </atkvæðaskrá>
</atkvæðagreiðsla>
```

- **The summary is a `<niðurstaða>` nested inside another `<niðurstaða>`**, and in the vote list the same block is called `<samantekt>` with `<afgreiðsla>`.
- **`<atkvæði>` takes five values**, explained in comments in Alþingi's XML:

  | Value | Meaning | In `fetch-votes` output |
  |---|---|---|
  | `já` | yes | `yes` |
  | `nei` | no | `no` |
  | `greiðir ekki atkvæði` | present, pressed "not voting" (often called *sitja hjá*) | `abstain` |
  | `boðaði fjarvist` | absence notified in advance (illness, official business) | `notifiedAbsence` |
  | `fjarverandi` | did not vote and had not notified an absence | `absent` |

  `boðaði fjarvist` did not appear in any of the votes downloaded for this work. It is handled because the comments document it.
- **The member list has no party.**

## A member's seats: `thingmenn/thingmadur/thingseta/?nr=1329`

```xml
<þingmaður id='1329'>
  <nafn>Guðmundur Ingi Kristinsson</nafn> …
  <þingsetur>
    <þingseta>
      <þing>157</þing>
      <tegund>þingmaður</tegund>
      <þingflokkur id='46'>Flokkur fólksins</þingflokkur>
      <kjördæmi id='52'><![CDATA[Suðvesturkjördæmi]]></kjördæmi>
      <tímabil><inn>16.03.2026</inn><út>12.04.2026</út></tímabil>
    </þingseta>
    <þingseta>
      <þing>157</þing>
      <tegund>þingmaður</tegund>
      <þingflokkur id='17'>utan þingflokka</þingflokkur> …
      <tímabil><inn>13.04.2026</inn><út>07.09.2026</út></tímabil>
    </þingseta>
    <þingseta> <þing>158</þing> … <tímabil><inn>08.09.2026</inn><út></út></tímabil> </þingseta>
  </þingsetur>
</þingmaður>
```

- **Group membership changes within a session.** This member left Flokkur fólksins on 13 April 2026, so a vote has to be credited to the group the member belonged to **on the day of the vote**.
- **A seat that hasn't ended has an empty `<út></út>`**, not a missing one.
- **`tegund`** is `þingmaður` or `með varamann` (a substitute is sitting). Substitutes appear in vote lists as members in their own right.

## Parliamentary groups: `thingflokkar/`

**Alþingi's abbreviations are not the list letters.** In this data `S` is Sjálfstæðisflokkur, `V` is Viðreisn and `F` is Framsóknarflokkur, while Samfylkingin is `Sf`. Mapping by abbreviation would credit votes to the wrong party, so `content/parties.json` maps by **group id** (`althingiGroupIds`):

| Group id | Name in Alþingi data | List letter |
|---|---|---|
| 2 | Framsóknarflokkur | B |
| 45 | Viðreisn | C |
| 35 | Sjálfstæðisflokkur | D |
| 46 | Flokkur fólksins | F |
| 47 | Miðflokkurinn | M |
| 43 | Píratar (sessions 142–155) | P |
| 38 | Samfylkingin | S |
| 23 | Vinstrihreyfingin - grænt framboð (sessions 124–155) | V |
| 17 | utan þingflokka (no group) | none |

Group 32, "Frjálslyndi flokkurinn" (sessions 124–136), is a different party from list letter O, "Frjálslyndi lýðræðisflokkurinn", and is deliberately not mapped.

## The prototype: `npm run fetch-votes`

```bash
npm run fetch-votes                                        # current session: every vote with its totals (1–2 requests)
npm run fetch-votes -- --session 157                       # a past session
npm run fetch-votes -- --session 157 --votes 69251,69066   # plus how each member and party voted
npm run fetch-votes -- --session 157 --type lg --limit 20  # member-level for the first 20 counted "lg" votes
```

- **Output:** `content/raw/althingi-votes-<session>.json`, which is not committed. See `content/raw/README.md`.
- **Requests:** member-level details cost one request per vote plus one per member, sent one at a time with a pause (`--delay`, default 1000 ms). Earlier runs' member-level details are kept when the file is regenerated.
- **Checks:** for each detailed vote, the member list must add up to the published totals. Any mismatch is recorded under `checks`.
- **It never creates questions.** A person picks a vote, opens its `pageUrl` on althingi.is, and writes the question (see CONTENT_GUIDE.md).

Output shape, abbreviated:

```json
{
  "source": "https://www.althingi.is/altext/xml",
  "session": 157,
  "fetchedAt": "2026-10-16T01:09:27.911Z",
  "note": "Raw data for writing questions. Never shown to players. …",
  "votes": [
    {
      "id": 69066,
      "session": 157,
      "time": "2026-02-02T17:59:28",
      "meeting": 65,
      "issue": { "number": 111, "kind": "A", "title": "sýslumaður", "url": "https://www.althingi.is/thingstorf/thingmalalistar-eftir-thingum/ferill/?ltg=157&mnr=111" },
      "type": { "code": "lg", "label": "Frv." },
      "document": 111,
      "method": "atkvæðagreiðslukerfi",
      "counts": { "yes": 32, "no": 11, "abstain": 9 },
      "outcome": "samþykkt",
      "pageUrl": "https://www.althingi.is/dba-bin/atkvgr.pl?nnafnak=69066",
      "byParty": { "S": { "yes": 14, "no": 0, "abstain": 0, "notifiedAbsence": 0, "absent": 1 }, "…": {} },
      "members": [{ "memberId": 1510, "name": "Alma D. Möller", "vote": "yes", "group": "Samfylkingin", "party": "S" }]
    }
  ]
}
```

In `byParty`, members whose group has no list letter are counted under the group's name, e.g. "utan þingflokka".
