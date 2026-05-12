import path from "path";
import fs from "fs";
import type {
  MlasFile,
  PartiesFile,
  ReportsFile,
  ReportContent,
  Mla,
  Party,
  SwarmNode,
  TimelinePoint,
  VoteBreakdownItem,
  PageJson,
  SessionSummary,
  SessionMetadata,
  TrackerMlasFile,
  PledgesFile,
  SessionCardMeta,
} from "./_types";

// process.cwd() in Next.js is the frontend/ directory at runtime.
// Data lives one level up at project root /data/mla-tracker/.
const DATA_DIR = path.join(process.cwd(), "..", "data", "mla-tracker");

function readJson<T>(filename: string): T {
  const full = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

export function getMlas(): MlasFile {
  return readJson<MlasFile>("mlas.json");
}

export function getParties(): PartiesFile {
  return readJson<PartiesFile>("parties.json");
}

export function getReports(): ReportsFile {
  return readJson<ReportsFile>("reports.json");
}

export function getReport(slug: string): ReportContent | null {
  try {
    return readJson<ReportContent>(`reports/${slug}.json`);
  } catch {
    return null;
  }
}

export function getMlaById(id: string): Mla | null {
  const { mlas } = getMlas();
  return mlas.find((m) => m.id === id) ?? null;
}

export function getPartyById(id: string): Party | null {
  const { parties } = getParties();
  return parties.find((p) => p.id === id) ?? null;
}

export function getMlasByParty(partyId: string): Mla[] {
  const { mlas } = getMlas();
  return mlas.filter((m) => m.party_id === partyId);
}

// ── Pre-computed chart data ───────────────────────────────────────────────────

export function buildSwarmNodes(): SwarmNode[] {
  const { mlas } = getMlas();
  const { parties } = getParties();
  const partyMap = new Map(parties.map((p) => [p.id, p]));

  return mlas.map((mla) => {
    const party = partyMap.get(mla.party_id);
    return {
      id: mla.id,
      name: mla.name,
      party_id: mla.party_id,
      party_name: party?.name ?? mla.party_id,
      party_color: party?.color ?? "#b4cfe8",
      party_shape: party?.shape ?? "circle",
      score: mla.pledge_delivery_score.value,
      constituency: mla.constituency,
      role: mla.role,
    };
  });
}

export function buildTimelineSeries(mla: Mla): TimelinePoint[] {
  return mla.snapshots.map((s) => {
    const [year, month] = s.month.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
      "en-GB",
      { month: "short", year: "numeric" }
    );
    return {
      month: s.month,
      label,
      contributions: s.chamber_contributions,
      delivery_score: s.pledge_delivery_score,
      committee_attendance: s.committee_attendance_pct,
    };
  });
}

export function buildVoteBreakdown(mla: Mla): VoteBreakdownItem[] {
  const counts: Record<string, number> = { For: 0, Against: 0, Abstain: 0 };
  for (const v of mla.votes) {
    const key = v.vote === "Not Present" ? "Abstain" : v.vote;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return [
    { label: "For", count: counts["For"] ?? 0, color: "#22c55e" },
    { label: "Against", count: counts["Against"] ?? 0, color: "#ef4444" },
    { label: "Abstain", count: counts["Abstain"] ?? 0, color: "rgba(180,207,232,0.4)" },
  ];
}

// ── Sessions (Hansard RAG) ────────────────────────────────────────────────────

const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

export function getPageJson(): PageJson {
  return readJson<PageJson>("page.json");
}

export function getTrackerMlas(): TrackerMlasFile {
  return readJson<TrackerMlasFile>("tracker-mlas.json");
}

export function getPledges(): PledgesFile {
  return readJson<PledgesFile>("pledges.json");
}

export function getSessionSummary(slug: string): SessionSummary | null {
  try {
    const full = path.join(SESSIONS_DIR, slug, "summary.json");
    return JSON.parse(fs.readFileSync(full, "utf-8")) as SessionSummary;
  } catch {
    return null;
  }
}

export function getSessionMetadata(slug: string): SessionMetadata | null {
  try {
    const full = path.join(SESSIONS_DIR, slug, "metadata.json");
    return JSON.parse(fs.readFileSync(full, "utf-8")) as SessionMetadata;
  } catch {
    return null;
  }
}

export function getSessionHansard(slug: string): string | null {
  try {
    const full = path.join(SESSIONS_DIR, slug, "hansard.txt");
    return fs.readFileSync(full, "utf-8");
  } catch {
    return null;
  }
}

export function listSessionSlugs(): string[] {
  try {
    return fs
      .readdirSync(SESSIONS_DIR)
      .filter((d) => !d.startsWith("_") && fs.statSync(path.join(SESSIONS_DIR, d)).isDirectory())
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function getRecentSessions(limit = 10): SessionCardMeta[] {
  const page = getPageJson();
  return page.recent_sessions.slice(0, limit);
}
