import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AlthingiFormatError,
  assertXml,
  groupOn,
  parseCurrentSession,
  parseSeatHistory,
  parseVoteDetail,
  parseVoteList,
  tallyByParty,
} from "./lib/althingi";

// Fixtures are trimmed copies of real responses from althingi.is/altext/xml,
// downloaded 2026-10-16. See scripts/fixtures/althingi/README.md.
const fixture = (name: string) => readFileSync(`scripts/fixtures/althingi/${name}`, "utf8");

describe("parseCurrentSession", () => {
  it("reads the session number", () => {
    expect(parseCurrentSession(fixture("current-session.xml"))).toBe(158);
  });
});

describe("parseVoteList", () => {
  const votes = parseVoteList(fixture("vote-list.xml"));

  it("reads every vote", () => {
    expect(votes.map((v) => [v.id, v.method, v.outcome])).toEqual([
      [68142, "yfirlýsing forseta/mál gengur", undefined],
      [69251, "atkvæðagreiðslukerfi", "samþykkt"],
      [68284, "atkvæðagreiðslukerfi", "fellt"],
      [68544, "nafnakall", "fellt"],
    ]);
  });

  it("reads the issue, type, counts and links of a counted vote", () => {
    expect(votes[1]).toEqual({
      id: 69251,
      session: 157,
      time: "2026-03-19T11:31:54",
      meeting: 86,
      issue: {
        number: 114,
        kind: "A",
        title: "veitingastaðir, gististaðir og skemmtanahald",
        url: "https://www.althingi.is/thingstorf/thingmalalistar-eftir-thingum/ferill/?ltg=157&mnr=114",
      },
      type: { code: "lg", label: "Frv." },
      document: 692,
      method: "atkvæðagreiðslukerfi",
      counts: { yes: 31, no: 23, abstain: 0 },
      outcome: "samþykkt",
      pageUrl: "https://www.althingi.is/dba-bin/atkvgr.pl?nnafnak=69251",
    });
  });

  it("has no counts or outcome for a vote the Speaker declared", () => {
    expect(votes[0].counts).toBeUndefined();
    expect(votes[0].pageUrl).toBeUndefined();
  });
});

describe("parseVoteDetail", () => {
  it("maps each member's vote", () => {
    const detail = parseVoteDetail(fixture("vote-detail.xml"));
    expect(detail.id).toBe(69066);
    expect(detail.members.map((m) => [m.memberId, m.vote])).toEqual([
      [1510, "yes"],
      [1004, "yes"],
      [1327, "no"],
      [1039, "absent"],
      [1160, "abstain"],
      [1414, "abstain"],
      [1253, "absent"],
      [1516, "no"],
    ]);
  });

  // Synthetic: Alþingi documents "boðaði fjarvist" in its XML comments, but none of the
  // downloaded votes contained one.
  it("reads a notified absence", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><atkvæðagreiðsla atkvæðagreiðslunúmer='1'><atkvæðaskrá>
      <þingmaður id='9'><nafn>Prófun</nafn><atkvæði>boðaði fjarvist</atkvæði></þingmaður></atkvæðaskrá></atkvæðagreiðsla>`;
    expect(parseVoteDetail(xml).members[0].vote).toBe("notifiedAbsence");
  });

  it("fails loudly on a vote value it doesn't know", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><atkvæðagreiðsla atkvæðagreiðslunúmer='1'><atkvæðaskrá>
      <þingmaður id='9'><nafn>Prófun</nafn><atkvæði>kannski</atkvæði></þingmaður></atkvæðaskrá></atkvæðagreiðsla>`;
    expect(() => parseVoteDetail(xml)).toThrow(AlthingiFormatError);
  });
});

describe("seat history", () => {
  const history = parseSeatHistory(fixture("seat-history.xml"));

  it("reads seats with their group and dates, including an open-ended one", () => {
    expect(history.memberId).toBe(1329);
    expect(history.seats).toHaveLength(8);
    expect(history.seats.at(-1)).toEqual({
      session: 158,
      groupId: 17,
      groupName: "utan þingflokka",
      from: "2026-09-08",
      to: undefined,
    });
  });

  it("finds the group on the day of a vote, across a change of group", () => {
    expect(groupOn(history.seats, "2026-03-19")).toEqual({ id: 46, name: "Flokkur fólksins" });
    expect(groupOn(history.seats, "2026-04-12")).toEqual({ id: 46, name: "Flokkur fólksins" });
    expect(groupOn(history.seats, "2026-04-13")).toEqual({ id: 17, name: "utan þingflokka" });
    expect(groupOn(history.seats, "2026-10-16")).toEqual({ id: 17, name: "utan þingflokka" });
    expect(groupOn(history.seats, "2024-01-01")).toBeUndefined();
  });
});

describe("tallyByParty", () => {
  it("counts each party's votes", () => {
    const { members } = parseVoteDetail(fixture("vote-detail.xml"));
    const party: Record<number, string> = { 1510: "S", 1004: "S", 1327: "M", 1039: "D", 1160: "D", 1414: "D", 1253: "F", 1516: "B" };
    expect(tallyByParty(members, (id) => party[id])).toEqual({
      S: { yes: 2, no: 0, abstain: 0, notifiedAbsence: 0, absent: 0 },
      M: { yes: 0, no: 1, abstain: 0, notifiedAbsence: 0, absent: 0 },
      D: { yes: 0, no: 0, abstain: 2, notifiedAbsence: 0, absent: 1 },
      F: { yes: 0, no: 0, abstain: 0, notifiedAbsence: 0, absent: 1 },
      B: { yes: 0, no: 1, abstain: 0, notifiedAbsence: 0, absent: 0 },
    });
  });
});

describe("assertXml", () => {
  it("accepts XML and explains an HTML response", () => {
    expect(() => assertXml(fixture("current-session.xml"), "u")).not.toThrow();
    expect(() => assertXml("<!DOCTYPE html><html><title>Just a moment...</title>", "https://example")).toThrow(
      /HTML page instead/,
    );
  });
});
