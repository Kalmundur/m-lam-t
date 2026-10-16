import { XMLParser } from "fast-xml-parser";

// Parsing for Alþingi's open XML data (https://www.althingi.is/altext/xml/).
// See docs/althingi-data.md for the endpoints and formats. Alþingi publishes no
// schema for these files and says the format can change without notice, so the
// parsers fail loudly on anything unexpected rather than guessing.

export const ALTHINGI_XML = "https://www.althingi.is/altext/xml";

export const althingiUrls = {
  currentSession: () => `${ALTHINGI_XML}/loggjafarthing/yfirstandandi/`,
  sessionVotes: (session: number) => `${ALTHINGI_XML}/atkvaedagreidslur/?lthing=${session}`,
  vote: (voteId: number) => `${ALTHINGI_XML}/atkvaedagreidslur/atkvaedagreidsla/?numer=${voteId}`,
  seatHistory: (memberId: number) => `${ALTHINGI_XML}/thingmenn/thingmadur/thingseta/?nr=${memberId}`,
};

/** How one member voted. Alþingi's own wording is in MEMBER_VOTE_TEXT. */
export type MemberVote = "yes" | "no" | "abstain" | "notifiedAbsence" | "absent";

export const MEMBER_VOTE_TEXT: Record<string, MemberVote> = {
  já: "yes",
  nei: "no",
  // "Sitting out": present, and pressed the button for not voting.
  "greiðir ekki atkvæði": "abstain",
  // Absence notified in advance, e.g. illness or official business.
  "boðaði fjarvist": "notifiedAbsence",
  // Did not vote and had not notified an absence.
  fjarverandi: "absent",
};

export type VoteSummary = {
  id: number;
  session: number;
  /** Local Icelandic time as Alþingi gives it, e.g. "2026-03-19T11:31:54". */
  time: string;
  meeting: number;
  issue: { number: number; kind: string; title: string; url?: string };
  /** Alþingi's vote-type code and label, e.g. { code: "lg", label: "Frv." }. */
  type: { code: string; label: string };
  document?: number;
  /** "atkvæðagreiðslukerfi" (electronic), "nafnakall" (roll call) or "yfirlýsing forseta/mál gengur" (declared, no count). */
  method: string;
  counts?: { yes: number; no: number; abstain: number };
  outcome?: "samþykkt" | "fellt";
  /** Alþingi's web page for the vote, with every member's vote. */
  pageUrl?: string;
};

export type MemberVoteRecord = { memberId: number; name: string; vote: MemberVote };

export type Seat = { session: number; groupId: number; groupName: string; from: string; to?: string };

/** Thrown when a response doesn't look like the XML we expect. */
export class AlthingiFormatError extends Error {}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (_name, jPath) =>
    [
      "atkvæðagreiðslur.atkvæðagreiðsla",
      "atkvæðagreiðsla.atkvæðaskrá.þingmaður",
      "þingmaður.þingsetur.þingseta",
      "löggjafarþing.þing",
    ].includes(String(jPath)),
});

type Node = Record<string, unknown>;

function fail(what: string): never {
  throw new AlthingiFormatError(`Unexpected Alþingi XML: ${what}. The format may have changed; see docs/althingi-data.md.`);
}

function node(value: unknown, what: string): Node {
  if (typeof value !== "object" || value === null) fail(`missing ${what}`);
  return value as Node;
}

function text(value: unknown, what: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && typeof (value as Node)["#text"] === "string") {
    return (value as Node)["#text"] as string;
  }
  fail(`missing ${what}`);
}

function int(value: unknown, what: string): number {
  const n = Number(text(value, what));
  if (!Number.isInteger(n)) fail(`${what} is not a whole number`);
  return n;
}

/** Cloudflare challenges and error pages come back as HTML, sometimes with status 200. */
export function assertXml(body: string, url: string): void {
  const start = body.trimStart().slice(0, 200).toLowerCase();
  if (!start.startsWith("<?xml")) {
    const hint = start.includes("<html") || start.includes("<!doctype")
      ? "Got an HTML page instead (possibly a Cloudflare check or an error page). Try again later, or open the URL in a browser."
      : "The response is not XML.";
    throw new AlthingiFormatError(`${url}: ${hint}`);
  }
}

function parse(xml: string): Node {
  return parser.parse(xml) as Node;
}

/** The number of the current legislative session (loggjafarthing/yfirstandandi). */
export function parseCurrentSession(xml: string): number {
  const sessions = node(parse(xml)["löggjafarþing"], "löggjafarþing")["þing"];
  if (!Array.isArray(sessions) || sessions.length === 0) fail("no <þing> in löggjafarþing");
  return int(node(sessions[0], "þing")["@númer"], "þing númer");
}

function parseCounts(summary: Node): VoteSummary["counts"] {
  if (summary["já"] === undefined) return undefined;
  const count = (key: string) => int(node(summary[key], key)["fjöldi"], `${key} fjöldi`);
  return { yes: count("já"), no: count("nei"), abstain: count("greiðirekkiatkvæði") };
}

function parseOutcome(value: unknown): VoteSummary["outcome"] {
  if (value === undefined) return undefined;
  // Alþingi writes both "samþykkt" and "Fellt".
  const outcome = text(value, "outcome").toLowerCase();
  if (outcome !== "samþykkt" && outcome !== "fellt") fail(`unknown outcome "${outcome}"`);
  return outcome;
}

/** All votes in a session (atkvaedagreidslur/?lthing=N). */
export function parseVoteList(xml: string): VoteSummary[] {
  const root = node(parse(xml)["atkvæðagreiðslur"], "atkvæðagreiðslur");
  const votes = (root["atkvæðagreiðsla"] as unknown[] | undefined) ?? [];
  return votes.map((raw) => {
    const v = node(raw, "atkvæðagreiðsla");
    const issue = node(v["mál"], "mál");
    const type = node(v["tegund"], "tegund");
    const summary = node(v["samantekt"], "samantekt");
    const details = v["nánar"] as Node | undefined;
    const document = v["þingskjal"] as Node | undefined;
    return {
      id: int(v["@atkvæðagreiðslunúmer"], "atkvæðagreiðslunúmer"),
      session: int(v["@þingnúmer"], "þingnúmer"),
      time: text(v["tími"], "tími"),
      meeting: int(v["fundur"], "fundur"),
      issue: {
        number: int(issue["@málsnúmer"], "málsnúmer"),
        kind: text(issue["@málsflokkur"], "málsflokkur"),
        title: text(issue["málsheiti"], "málsheiti"),
        url: issue["html"] === undefined ? undefined : text(issue["html"], "mál html"),
      },
      type: { code: text(type["@tegund"], "tegund code"), label: text(type, "tegund") },
      document: document ? int(document["@skjalsnúmer"], "skjalsnúmer") : undefined,
      method: text(summary["aðferð"], "aðferð"),
      counts: parseCounts(summary),
      outcome: parseOutcome(summary["afgreiðsla"]),
      pageUrl: details?.["html"] === undefined ? undefined : text(details["html"], "nánar html"),
    };
  });
}

/** How each member voted (atkvaedagreidslur/atkvaedagreidsla/?numer=N). */
export function parseVoteDetail(xml: string): { id: number; members: MemberVoteRecord[] } {
  const root = node(parse(xml)["atkvæðagreiðsla"], "atkvæðagreiðsla");
  const list = root["atkvæðaskrá"] as Node | undefined;
  const members = ((list?.["þingmaður"] as unknown[] | undefined) ?? []).map((raw) => {
    const m = node(raw, "þingmaður");
    const voteText = text(m["atkvæði"], "atkvæði");
    const vote = MEMBER_VOTE_TEXT[voteText];
    if (!vote) fail(`unknown member vote "${voteText}"`);
    return { memberId: int(m["@id"], "þingmaður id"), name: text(m["nafn"], "nafn"), vote };
  });
  return { id: int(root["@atkvæðagreiðslunúmer"], "atkvæðagreiðslunúmer"), members };
}

/** "13.04.2026" → "2026-04-13" */
function isoFromIcelandic(date: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date);
  if (!match) fail(`unexpected date "${date}"`);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** A member's seats with their parliamentary group and dates (thingmenn/thingmadur/thingseta/?nr=N). */
export function parseSeatHistory(xml: string): { memberId: number; name: string; seats: Seat[] } {
  const root = node(parse(xml)["þingmaður"], "þingmaður");
  const seatList = root["þingsetur"] as Node | undefined;
  const seats = ((seatList?.["þingseta"] as unknown[] | undefined) ?? []).map((raw) => {
    const s = node(raw, "þingseta");
    const group = node(s["þingflokkur"], "þingflokkur");
    const period = node(s["tímabil"], "tímabil");
    // A seat that hasn't ended has an empty <út></út>.
    const until = period["út"] === undefined ? "" : text(period["út"], "út");
    return {
      session: int(s["þing"], "þing"),
      groupId: int(group["@id"], "þingflokkur id"),
      groupName: text(group, "þingflokkur"),
      from: isoFromIcelandic(text(period["inn"], "inn")),
      to: until === "" ? undefined : isoFromIcelandic(until),
    };
  });
  return { memberId: int(root["@id"], "þingmaður id"), name: text(root["nafn"], "nafn"), seats };
}

/** The member's parliamentary group on a date (YYYY-MM-DD), from their seat history. */
export function groupOn(seats: readonly Seat[], date: string): { id: number; name: string } | undefined {
  const seat = seats.find((s) => s.from <= date && (s.to === undefined || date <= s.to));
  return seat ? { id: seat.groupId, name: seat.groupName } : undefined;
}

export type PartyTally = Record<MemberVote, number>;

const emptyTally = (): PartyTally => ({ yes: 0, no: 0, abstain: 0, notifiedAbsence: 0, absent: 0 });

/**
 * Counts each party's votes. `partyOf` maps a member to a list letter, or to a
 * label such as "utan þingflokka" for members outside any party in the registry.
 */
export function tallyByParty(
  members: readonly MemberVoteRecord[],
  partyOf: (memberId: number) => string,
): Record<string, PartyTally> {
  const tallies: Record<string, PartyTally> = {};
  for (const m of members) {
    const party = partyOf(m.memberId);
    tallies[party] ??= emptyTally();
    tallies[party][m.vote]++;
  }
  return tallies;
}
