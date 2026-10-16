// Prototype: downloads Alþingi's vote records for one legislative session
// (löggjafarþing) into content/raw/ as JSON, for people writing "Hvernig var
// kosið?" questions. It never creates questions: a person picks a vote, checks it
// on althingi.is and writes the question by hand. See docs/althingi-data.md.
//
//   npm run fetch-votes                                        # current session: every vote with its totals
//   npm run fetch-votes -- --session 157                       # a past session
//   npm run fetch-votes -- --session 157 --votes 69251,69066   # plus how each member and party voted
//   npm run fetch-votes -- --session 157 --type lg --limit 20  # the same for the first 20 counted votes of type "lg"
//
// Totals for a whole session take one request. Member-level details take one
// request per vote plus one per member (to find their party on the day), sent one
// at a time with a pause between them (--delay, default 1000 ms).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CONTACT_EMAIL } from "../src/config";
import { PartyRegistrySchema } from "../src/lib/content/schema";
import {
  ALTHINGI_XML,
  althingiUrls,
  assertXml,
  groupOn,
  parseCurrentSession,
  parseSeatHistory,
  parseVoteDetail,
  parseVoteList,
  tallyByParty,
  type MemberVote,
  type PartyTally,
  type Seat,
  type VoteSummary,
} from "./lib/althingi";
import { PARTIES_FILE } from "./lib/content-files";

const USER_AGENT = `Malamot/0.1 (data prototype; ${CONTACT_EMAIL})`;

type MemberRow = { memberId: number; name: string; vote: MemberVote; group?: string; party?: string };
type VoteRow = VoteSummary & { byParty?: Record<string, PartyTally>; members?: MemberRow[]; checks?: string[] };
type Output = { source: string; session: number; fetchedAt: string; note: string; votes: VoteRow[] };

const { values } = parseArgs({
  options: {
    session: { type: "string" },
    votes: { type: "string" },
    type: { type: "string" },
    limit: { type: "string" },
    delay: { type: "string", default: "1000" },
    out: { type: "string", default: "content/raw" },
  },
});

function positiveInt(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error(`--${name} must be a whole number, got "${value}"`);
  return n;
}

const delayMs = positiveInt(values.delay, "delay") ?? 1000;
let requests = 0;

async function getXml(url: string): Promise<string> {
  if (requests++ > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/xml" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const body = await response.text();
  assertXml(body, url);
  return body;
}

/** Alþingi group id → list letter, from content/parties.json. */
function groupLetters(): Map<number, string> {
  const registry = PartyRegistrySchema.parse(JSON.parse(readFileSync(PARTIES_FILE, "utf8")));
  return new Map(registry.parties.flatMap((p) => (p.althingiGroupIds ?? []).map((id) => [id, p.letter] as const)));
}

function selectForDetails(votes: VoteSummary[]): VoteSummary[] {
  const counted = votes.filter((v) => v.counts);
  let selected: VoteSummary[] = [];
  if (values.votes) {
    const ids = values.votes.split(",").map((id) => positiveInt(id.trim(), "votes")!);
    const missing = ids.filter((id) => !votes.some((v) => v.id === id));
    if (missing.length) throw new Error(`Votes not found in this session: ${missing.join(", ")}`);
    const declared = ids.filter((id) => !counted.some((v) => v.id === id));
    if (declared.length) console.log(`Skipping ${declared.join(", ")}: declared by the Speaker, so there is no member list.`);
    selected = counted.filter((v) => ids.includes(v.id));
  } else if (values.type) {
    const codes = values.type.split(",").map((c) => c.trim());
    selected = counted.filter((v) => codes.includes(v.type.code));
  }
  const limit = positiveInt(values.limit, "limit");
  return limit === undefined ? selected : selected.slice(0, limit);
}

async function main() {
  const session =
    positiveInt(values.session, "session") ?? parseCurrentSession(await getXml(althingiUrls.currentSession()));
  console.log(`Löggjafarþing ${session}: fetching the vote list…`);
  const votes: VoteRow[] = parseVoteList(await getXml(althingiUrls.sessionVotes(session)));

  const selected = selectForDetails(votes);
  const letters = groupLetters();
  const seatsByMember = new Map<number, Seat[]>();
  const unmappedGroups = new Set<string>();

  if (selected.length) {
    console.log(`Fetching member-level votes for ${selected.length} vote(s), one request at a time…`);
  }
  for (const summary of selected) {
    const row = votes.find((v) => v.id === summary.id)!;
    const { members } = parseVoteDetail(await getXml(althingiUrls.vote(summary.id)));
    for (const m of members) {
      if (!seatsByMember.has(m.memberId)) {
        seatsByMember.set(m.memberId, parseSeatHistory(await getXml(althingiUrls.seatHistory(m.memberId))).seats);
      }
    }

    // Credit each vote to the member's group on the day of the vote; members change groups.
    const day = summary.time.slice(0, 10);
    const rows: MemberRow[] = members.map((m) => {
      const group = groupOn(seatsByMember.get(m.memberId)!, day);
      const party = group ? letters.get(group.id) : undefined;
      if (group && !party) unmappedGroups.add(`${group.id} ${group.name}`);
      return { ...m, group: group?.name, party };
    });
    row.members = rows;
    row.byParty = tallyByParty(rows, (id) => {
      const r = rows.find((x) => x.memberId === id)!;
      return r.party ?? r.group ?? "óþekkt";
    });

    // The member list should add up to the published totals.
    const count = (vote: MemberVote) => rows.filter((r) => r.vote === vote).length;
    const checks: string[] = [];
    if (summary.counts && count("yes") !== summary.counts.yes) checks.push(`yes: ${count("yes")} members vs total ${summary.counts.yes}`);
    if (summary.counts && count("no") !== summary.counts.no) checks.push(`no: ${count("no")} members vs total ${summary.counts.no}`);
    if (summary.counts && count("abstain") !== summary.counts.abstain) {
      checks.push(`abstain: ${count("abstain")} members vs total ${summary.counts.abstain}`);
    }
    if (checks.length) row.checks = checks;
    console.log(`  ${summary.id} ${summary.issue.title}: ${summary.outcome ?? "?"}${checks.length ? " (totals don't match, see checks)" : ""}`);
  }

  // Keep member-level details fetched in earlier runs for votes not fetched this time.
  const outFile = path.join(values.out, `althingi-votes-${session}.json`);
  if (existsSync(outFile)) {
    const previous = JSON.parse(readFileSync(outFile, "utf8")) as Output;
    for (const old of previous.votes) {
      const row = votes.find((v) => v.id === old.id);
      if (row && !row.members && old.members) Object.assign(row, { members: old.members, byParty: old.byParty, checks: old.checks });
    }
  }

  const output: Output = {
    source: ALTHINGI_XML,
    session,
    fetchedAt: new Date().toISOString(),
    note:
      "Raw data for writing questions. Never shown to players. Check every vote on althingi.is (pageUrl) before using it in a question.",
    votes,
  };
  mkdirSync(values.out, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

  const withDetails = votes.filter((v) => v.members).length;
  console.log(`\nWrote ${outFile}: ${votes.length} votes (${votes.filter((v) => v.counts).length} counted), ${withDetails} with member-level votes.`);
  if (unmappedGroups.size) {
    console.log(`Groups with no list letter in content/parties.json (shown by name): ${[...unmappedGroups].join("; ")}`);
  }
}

main().catch((error: Error) => {
  console.error(`fetch-votes failed: ${error.message}`);
  process.exit(1);
});
