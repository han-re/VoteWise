// Provenance: attached to every data point so the origin is always traceable
export interface Provenance<T = number | string> {
  value: T;
  source: string;
  source_urls: string[];
  computed_at: string;
  method: string;
}

// ── Party ────────────────────────────────────────────────────────────────────

export interface PartyPledge {
  id: string;
  title: string;
  category: string;
  status: "backed" | "partial" | "mismatch" | "unknown";
  evidence: string;
  source_urls: string[];
  last_checked: string;
}

export interface Party {
  id: string;
  name: string;
  short_name: string;
  color: string;
  shape: "circle" | "square" | "diamond" | "triangle" | "hexagon" | "pentagon";
  leader: string;
  seats_2022: number;
  ideology: string;
  overall_score: Provenance<number>;
  pledges: PartyPledge[];
  delivery_summary: {
    backed: Provenance<number>;
    partial: Provenance<number>;
    mismatch: Provenance<number>;
    unknown: Provenance<number>;
  };
}

export interface PartiesFile {
  schema_version: string;
  last_updated: string;
  parties: Party[];
}

// ── MLA ──────────────────────────────────────────────────────────────────────

export interface MonthlySnapshot {
  month: string;
  pledge_delivery_score: number;
  chamber_contributions: number;
  committee_attendance_pct: number;
}

export interface MlaPledge {
  id: string;
  title: string;
  party_pledge: boolean;
  status: "backed" | "partial" | "mismatch" | "unknown";
  evidence: Provenance<string>;
  category: string;
  last_checked: string;
}

export interface VoteRecord {
  id: string;
  bill: string;
  date: string;
  vote: "For" | "Against" | "Abstain" | "Not Present";
  policy_axis: string;
  hansard_url: string;
  provenance: Provenance<string>;
}

export interface ContributionRecord {
  date: string;
  month: string;
  topic: string;
  type: "question" | "debate" | "statement" | "committee";
  hansard_url: string;
  excerpt?: string;
}

export interface InterestRecord {
  type: string;
  entity: string;
  registered_date: string;
  value?: string;
  source_url: string;
  provenance: Provenance<string>;
}

export interface DonationRecord {
  donor: string;
  amount: number;
  date: string;
  type: string;
  source_url: string;
  provenance: Provenance<number>;
}

export interface CommitteeRecord {
  name: string;
  role: "Member" | "Chair" | "Deputy Chair";
  since: string;
  source_url: string;
}

export interface Mla {
  id: string;
  name: string;
  party_id: string;
  constituency: string;
  role?: string;
  bio_short: string;
  photo_url: string | null;
  pledge_delivery_score: Provenance<number>;
  party_line_voting_pct: Provenance<number>;
  chamber_contributions_total: Provenance<number>;
  committee_attendance_pct: Provenance<number>;
  snapshots: MonthlySnapshot[];
  pledges: MlaPledge[];
  votes: VoteRecord[];
  contributions: ContributionRecord[];
  interests: InterestRecord[];
  donations: DonationRecord[];
  committees: CommitteeRecord[];
}

export interface MlasFile {
  schema_version: string;
  last_updated: string;
  mlas: Mla[];
}

// ── Sessions (Hansard RAG) ────────────────────────────────────────────────────

export interface SessionSpeaker {
  name: string;
  party: string;
  contribution_count: number;
}

export interface SessionTopicRaised {
  topic: string;
  first_mention_line: number;
}

export interface SessionVoteRecord {
  motion: string;
  result: string;
  for: number;
  against: number;
  abstain: number;
  line: number;
}

export interface KeyDebate {
  topic: string;
  summary: string;
}

export interface ExtendedSummary {
  overview: string;
  key_debates: KeyDebate[];
  outcomes: string;
}

export interface NotableMoment {
  speaker: string;
  party: string;
  quote: string;
  context: string;
  alignment_note: string;
}

export interface SessionSummary {
  session_id: string;
  date: string;
  session_type: "plenary" | "committee" | "questions" | "debate";
  duration_estimate_minutes: number;
  card_summary: string;
  headline_summary: string;
  extended_summary: ExtendedSummary | string; // string for legacy data
  key_topics: string[];
  key_speakers: SessionSpeaker[];
  notable_moments: NotableMoment[] | string[]; // string[] for legacy data
}

export interface SessionMetadata {
  session_id: string;
  speakers: SessionSpeaker[];
  topics_raised: SessionTopicRaised[];
  votes_recorded: SessionVoteRecord[];
}

export interface EmbeddingChunk {
  chunk_id: string;
  speaker: string;
  party: string;
  line_start: number;
  line_end: number;
  text: string;
  // embedding omitted — handled server-side only
}

// Lightweight shape used in session cards and page.json
export interface SessionCardMeta {
  slug: string;
  date: string;
  headline: string;
  session_type: string;
  key_topics: string[];
}

export interface PageJson {
  schema_version: string;
  last_updated: string;
  featured: {
    headline: string;
    kicker: string;
    summary: string;
    session_slug: string;
  } | null;
  recent_sessions: SessionCardMeta[];
}

// ── Tracker MLA (lighter schema for new UI) ───────────────────────────────────

export interface TrackerMla {
  slug: string;
  name: string;
  party: string;
  party_short_name: string;
  party_color: string;
  constituency: string;
  role?: string;
  pledge_delivery_score: Provenance<number>;
  party_line_voting_pct: Provenance<number>;
  chamber_contributions_total: Provenance<number>;
  committee_attendance_pct: Provenance<number>;
}

export interface TrackerMlasFile {
  schema_version: string;
  last_updated: string;
  mlas: TrackerMla[];
}

// ── Pledges ───────────────────────────────────────────────────────────────────

export interface Pledge {
  pledge_id: string;
  party: string;
  mla_slug: string | null;
  topic: string;
  pledge_text: string;
  source_urls: string[];
  delivery_status: "backed" | "partial" | "mismatch" | "unknown";
  evidence: string;
  last_checked: string;
}

export interface PledgesFile {
  schema_version: string;
  last_updated: string;
  pledges: Pledge[];
}

// ── Chatbot message ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

// ── Reports ───────────────────────────────────────────────────────────────────

export type ReportSectionType = "heading" | "paragraph" | "callout";
export type CalloutType = "finding" | "caveat" | "quote";

export interface ReportSection {
  type: ReportSectionType;
  content: string;
  callout_type?: CalloutType;
}

export interface ReportMeta {
  slug: string;
  title: string;
  subtitle: string;
  published: string;
  author: string;
  topics: string[];
  parties_covered: string[];
  mlas_featured: string[];
  data_hash: string;
}

export interface ReportContent extends ReportMeta {
  body: ReportSection[];
}

export interface ReportsFile {
  schema_version: string;
  last_updated: string;
  reports: ReportMeta[];
}

// ── Chart data shapes (serialisable, safe to pass as props to client components) ──

export interface SwarmNode {
  id: string;
  name: string;
  party_id: string;
  party_name: string;
  party_color: string;
  party_shape: Party["shape"];
  score: number;
  constituency: string;
  role?: string;
}

export interface TimelinePoint {
  month: string;
  label: string;        // e.g. "Jan 2026"
  contributions: number;
  delivery_score: number;
  committee_attendance: number;
}

export interface VoteBreakdownItem {
  label: "For" | "Against" | "Abstain";
  count: number;
  color: string;
}

export interface PledgeStatusSummary {
  backed: number;
  partial: number;
  mismatch: number;
  unknown: number;
  total: number;
}
