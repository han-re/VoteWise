"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { DataTable, type Column } from "../../components/DataTable";
import { useSetProPage } from "../../components/ProPageContext";
import { ChatbotProvider, useChatbot } from "../../../components/tracker/ChatbotProvider";
import { FloatingChatbot } from "../../../components/tracker/FloatingChatbot";
import TrackerVerificationPanel from "../../../components/tracker/TrackerVerificationPanel";

interface SessionParticipant {
  mla_id: string;
  name: string;
  party_id: string;
  party_name: string;
  party_color: string;
  attended: boolean;
  speech_count: number;
  division_votes: number;
  written_questions: number;
  engagement_score: number;
  session_date: string;
  session_id: string;
}

interface ProSessionDetail {
  session_id: string;
  date: string;
  title: string;
  agenda_summary: string;
  hansard_url: string;
  total_divisions: number;
  attendee_count: number;
  speech_count_total: number;
  mla_participation: SessionParticipant[];
}

interface KeyDebate {
  topic: string;
  summary: string;
}

interface ExtendedSummary {
  overview: string;
  key_debates: KeyDebate[];
  outcomes: string;
}

interface NotableMoment {
  speaker: string;
  party: string;
  quote: string;
  context: string;
  alignment_note: string;
}

interface TrackerSessionSummary {
  session_id: string;
  date: string;
  session_type: string;
  duration_estimate_minutes: number;
  card_summary: string;
  headline_summary: string;
  extended_summary: ExtendedSummary | string;
  key_topics: string[];
  key_speakers: { name: string; party: string; contribution_count: number }[];
  notable_moments: NotableMoment[] | string[];
}

interface TrackerSpeaker {
  name: string;
  party: string;
  contribution_count: number;
}

interface TrackerSessionMetadata {
  session_id: string;
  speakers?: TrackerSpeaker[];
  votes_recorded?: unknown[];
}

interface TrackerSessionDetail {
  slug: string;
  summary: TrackerSessionSummary;
  metadata: TrackerSessionMetadata | null;
}

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  padding: "16px 18px",
};

const sectionTitle: CSSProperties = {
  fontSize: 25.3,
  fontWeight: 650,
  color: "#ffffff",
  textTransform: "none",
  letterSpacing: 0,
  margin: 0,
};

const PARTY_COLOR_BY_NAME: Record<string, string> = {
  alliance: "#F6CB2F",
  dup: "#D4213D",
  "sinn féin": "#326760",
  "sinn fÃ©in": "#326760",
  uup: "#48A5DD",
  sdlp: "#2E9A41",
  tuv: "#4A7AB5",
  "people before profit": "#C0392B",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function partyColorForName(party: string): string {
  const clean = party.trim().toLowerCase();
  if (!clean || clean === "unknown") return "#7dd3fc";
  return PARTY_COLOR_BY_NAME[clean] ?? "#7dd3fc";
}

function partyIdForName(party: string): string {
  return party
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";
}

function speakerId(name: string): string {
  return `tracker_speaker_${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

function buildTrackerParticipation(tracker: TrackerSessionDetail): SessionParticipant[] {
  const byName = new Map<string, TrackerSpeaker>();
  const sourceSpeakers = [
    ...(tracker.metadata?.speakers ?? []),
    ...tracker.summary.key_speakers,
  ];

  for (const speaker of sourceSpeakers) {
    if (!speaker.name.trim()) continue;
    const existing = byName.get(speaker.name);
    if (!existing || speaker.contribution_count > existing.contribution_count) {
      byName.set(speaker.name, speaker);
    }
  }

  const speakers = [...byName.values()].sort((a, b) => b.contribution_count - a.contribution_count);
  const maxContributions = Math.max(1, ...speakers.map((speaker) => speaker.contribution_count));

  return speakers.map((speaker) => ({
    mla_id: speakerId(speaker.name),
    name: speaker.name,
    party_id: partyIdForName(speaker.party),
    party_name: speaker.party || "Unknown",
    party_color: partyColorForName(speaker.party),
    attended: true,
    speech_count: speaker.contribution_count,
    division_votes: 0,
    written_questions: 0,
    engagement_score: Math.round((speaker.contribution_count / maxContributions) * 1000) / 10,
    session_date: tracker.summary.date,
    session_id: tracker.slug,
  }));
}

function AskSessionButton({ sessionId }: { sessionId: string }) {
  const { openFor } = useChatbot();
  return (
    <button
      type="button"
      onClick={() => openFor(sessionId)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        background: "rgba(125,211,252,0.08)",
        border: "1px solid var(--vw-pro-cyan)",
        borderRadius: "8px",
        padding: "0.5rem 1rem",
        cursor: "pointer",
        fontSize: "0.88rem",
        color: "var(--vw-pro-cyan)",
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Ask about this session
    </button>
  );
}

function normaliseExtended(raw: ExtendedSummary | string | undefined): ExtendedSummary | null {
  if (!raw) return null;
  if (typeof raw === "string") return { overview: raw, key_debates: [], outcomes: "" };
  return raw;
}

function normaliseNotableMoments(raw: NotableMoment[] | string[] | undefined): NotableMoment[] {
  if (!raw?.length) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((quote) => ({
      speaker: "",
      party: "",
      quote,
      context: "",
      alignment_note: "",
    }));
  }
  return raw as NotableMoment[];
}

const paragraphStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "rgba(205,220,236,0.72)",
  fontSize: 13.5,
  lineHeight: 1.7,
};

function NarrativeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h4
        style={{
          margin: "0 0 10px",
          color: "rgba(180,207,232,0.56)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function NotableMomentCard({ moment }: { moment: NotableMoment }) {
  return (
    <article
      style={{
        border: "1px solid var(--vw-pro-grid)",
        borderRadius: 8,
        background: "rgba(11,20,38,0.38)",
        padding: "14px 15px",
      }}
    >
      {(moment.speaker || moment.party) && (
        <div style={{ marginBottom: 10 }}>
          {moment.speaker && (
            <strong style={{ display: "block", color: "#e6eef7", fontSize: 13.5 }}>{moment.speaker}</strong>
          )}
          {moment.party && moment.party !== "Unknown" && (
            <span style={{ color: "rgba(180,207,232,0.5)", fontSize: 12 }}>{moment.party}</span>
          )}
        </div>
      )}
      <blockquote
        style={{
          margin: "0 0 10px",
          paddingLeft: 12,
          borderLeft: "3px solid rgba(125,211,252,0.55)",
          color: "rgba(230,238,247,0.82)",
          fontSize: 13.5,
          lineHeight: 1.65,
          fontStyle: "italic",
        }}
      >
        &ldquo;{moment.quote}&rdquo;
      </blockquote>
      {moment.context && (
        <p style={{ margin: "0 0 8px", color: "rgba(205,220,236,0.62)", fontSize: 12.5, lineHeight: 1.55 }}>
          {moment.context}
        </p>
      )}
      {moment.alignment_note && (
        <p style={{ margin: 0, color: "rgba(125,211,252,0.75)", fontSize: 12, lineHeight: 1.5 }}>
          {moment.alignment_note}
        </p>
      )}
    </article>
  );
}

function TrackerNarrativeSection({ tracker }: { tracker: TrackerSessionDetail }) {
  const extended = normaliseExtended(tracker.summary.extended_summary);
  const moments = normaliseNotableMoments(tracker.summary.notable_moments);

  if (!extended && moments.length === 0) return null;

  const summaryId = `pro-session-summary-${tracker.slug}`;
  const momentsId = `pro-session-moments-${tracker.slug}`;
  const tabStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    border: "0",
    borderBottom: "1px solid rgba(125,211,252,0.42)",
    background: "transparent",
    color: "rgba(230,238,247,0.78)",
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 650,
    padding: "4px 1px 6px",
    textDecoration: "none",
  };

  return (
    <section style={cardStyle}>
      <header style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h3 style={sectionTitle}>
            Tracker session brief
          </h3>
          <p style={{ margin: "6px 0 0", color: "rgba(205,220,236,0.78)", fontSize: 13, lineHeight: 1.55 }}>
            Transcript-backed summary, debates, outcomes, and notable moments from the MLA Tracker.
          </p>
        </div>
        {tracker.summary.duration_estimate_minutes > 0 && (
          <span style={{ color: "rgba(180,207,232,0.5)", fontSize: 11.5, fontFamily: "var(--vw-pro-mono)", whiteSpace: "nowrap" }}>
            ~{tracker.summary.duration_estimate_minutes} min
          </span>
        )}
      </header>

      <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }} aria-label="Session brief sections">
        <a href={`#${summaryId}`} style={tabStyle}>Summary</a>
        <a href={`#${momentsId}`} style={tabStyle}>Notable moments</a>
      </nav>

      {extended && (
        <section id={summaryId} style={{ scrollMarginTop: 96 }}>
          <NarrativeBlock title="Summary">
            {extended.overview && (
              <div>
                <h5 style={miniHeadingStyle}>Overview</h5>
                {extended.overview.split("\n\n").filter(Boolean).map((para, index) => (
                  <p key={index} style={paragraphStyle}>{para}</p>
                ))}
              </div>
            )}

            {extended.key_debates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h5 style={miniHeadingStyle}>What was discussed</h5>
                <div style={{ display: "grid", gap: 14 }}>
                  {extended.key_debates.map((debate) => (
                    <article
                      key={debate.topic}
                      style={{
                        borderLeft: "3px solid var(--vw-pro-cyan)",
                        padding: "8px 0 8px 14px",
                        background: "rgba(125,211,252,0.035)",
                        borderRadius: 6,
                      }}
                    >
                      <h6 style={{ margin: "0 0 8px", color: "#e6eef7", fontSize: 14, fontWeight: 700 }}>
                        {debate.topic}
                      </h6>
                      {debate.summary.split("\n\n").filter(Boolean).map((para, index) => (
                        <p key={index} style={paragraphStyle}>{para}</p>
                      ))}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {extended.outcomes && (
              <div style={{ marginTop: 16 }}>
                <h5 style={miniHeadingStyle}>Decisions and outcomes</h5>
                {extended.outcomes.split("\n\n").filter(Boolean).map((para, index) => (
                  <p key={index} style={paragraphStyle}>{para}</p>
                ))}
              </div>
            )}
          </NarrativeBlock>
        </section>
      )}

      <section id={momentsId} style={{ scrollMarginTop: 96 }}>
        {moments.length > 0 ? (
          <NarrativeBlock title="Notable moments">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {moments.map((moment, index) => (
                <NotableMomentCard key={`${moment.speaker}-${index}`} moment={moment} />
              ))}
            </div>
          </NarrativeBlock>
        ) : (
          <NarrativeBlock title="Notable moments">
            <p style={paragraphStyle}>No notable moments were extracted for this session.</p>
          </NarrativeBlock>
        )}
      </section>
    </section>
  );
}

const miniHeadingStyle: CSSProperties = {
  margin: "0 0 9px",
  color: "#e6eef7",
  fontSize: 14,
  fontWeight: 700,
};

function TrackerSessionVerificationSection({ tracker }: { tracker: TrackerSessionDetail }) {
  const payload = {
    record_type: "tracker_session",
    slug: tracker.slug,
    summary: tracker.summary,
    metadata: tracker.metadata,
  };

  return (
    <section style={cardStyle}>
      <header style={{ marginBottom: 14 }}>
        <h3 style={sectionTitle}>Solana verification</h3>
        <p style={{ margin: "6px 0 0", color: "rgba(205,220,236,0.62)", fontSize: 13, lineHeight: 1.55 }}>
          Verifies this Pro session view against the tracker session record stamped on Solana devnet.
        </p>
      </header>
      <TrackerVerificationPanel
        recordId={`tracker_session_${tracker.slug}`}
        subjectLabel="Pro session report"
        payload={payload}
        accentColor="var(--vw-pro-cyan)"
      />
    </section>
  );
}

function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ProSessionDetail | null>(null);
  const [trackerData, setTrackerData] = useState<TrackerSessionDetail | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useSetProPage("Stormont Sessions", ["Stormont Sessions"]);

  useEffect(() => {
    if (!sessionId) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    Promise.allSettled([
      fetch(`${base}/pro/sessions/${sessionId}`).then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<ProSessionDetail>;
      }),
      fetch(`/api/tracker-sessions/${sessionId}`).then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<TrackerSessionDetail>;
      }),
    ])
      .then(([proResult, trackerResult]) => {
        const pro = proResult.status === "fulfilled" ? proResult.value : null;
        const tracker = trackerResult.status === "fulfilled" ? trackerResult.value : null;
        setData(pro);
        setTrackerData(tracker);
        setError(!pro && !tracker);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [sessionId]);

  const columns: Column<SessionParticipant>[] = useMemo(() => [
    {
      key: "name",
      header: "MLA",
      render: (r) => r.mla_id.startsWith("tracker_speaker_") ? (
        <span style={{ color: "#cddcec" }}>{r.name}</span>
      ) : (
        <Link href={`/mla/${r.mla_id}`} style={{ color: "#cddcec", textDecoration: "none" }}>
          {r.name}
        </Link>
      ),
      sortValue: (r) => r.name,
    },
    {
      key: "party",
      header: "Party",
      render: (r) => (
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 4,
            background: `${r.party_color}33`,
            color: r.party_color,
            fontWeight: 600,
          }}
        >
          {r.party_name}
        </span>
      ),
      sortValue: (r) => r.party_name,
      width: 170,
    },
    {
      key: "attended",
      header: "Attended",
      render: (r) => (r.attended ? "Yes" : "No"),
      sortValue: (r) => (r.attended ? 1 : 0),
      width: 90,
    },
    {
      key: "speech",
      header: "Speeches",
      render: (r) => r.speech_count,
      sortValue: (r) => r.speech_count,
      numeric: true,
      width: 100,
    },
    {
      key: "div",
      header: "Division votes",
      render: (r) => r.division_votes,
      sortValue: (r) => r.division_votes,
      numeric: true,
      width: 130,
    },
    {
      key: "written",
      header: "Written Qs",
      render: (r) => r.written_questions,
      sortValue: (r) => r.written_questions,
      numeric: true,
      width: 110,
    },
    {
      key: "engagement",
      header: "Engagement",
      render: (r) => r.engagement_score,
      sortValue: (r) => r.engagement_score,
      numeric: true,
      width: 130,
    },
  ], []);

  if (loading) return <div style={{ color: "rgba(180,207,232,0.55)" }}>Loading session…</div>;
  if (error || (!data && !trackerData)) return <div style={cardStyle}>Session not found.</div>;

  const displayDate = data?.date ?? trackerData?.summary.date ?? "";
  const displayTitle = data?.title ?? trackerData?.summary.card_summary ?? "Session";
  const displaySummary = data?.agenda_summary ?? trackerData?.summary.headline_summary ?? "";
  const hansardUrl = data?.hansard_url;
  const attendeeCount = data?.attendee_count ?? trackerData?.summary.key_speakers.length ?? 0;
  const speechCount = data?.speech_count_total ?? trackerData?.summary.key_speakers.reduce((total, speaker) => total + speaker.contribution_count, 0) ?? 0;
  const totalDivisions = data?.total_divisions ?? 0;
  const participationRows = data?.mla_participation ?? (trackerData ? buildTrackerParticipation(trackerData) : []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Session header */}
      <section style={{ ...cardStyle, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--vw-pro-cyan)", letterSpacing: "0.04em" }}>
              {displayDate ? formatDate(displayDate) : ""}
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 25.3, fontWeight: 650, color: "#ffffff" }}>
              {displayTitle}
            </h2>
          </div>
          {hansardUrl && (
            <a
              href={hansardUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--vw-pro-cyan)",
                textDecoration: "none",
                fontSize: 13,
                border: "1px solid var(--vw-pro-grid)",
                padding: "6px 12px",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              Hansard &#8599;
            </a>
          )}
        </div>
        <p style={{ marginTop: 12, color: "rgba(205,220,236,0.7)", fontSize: 14, lineHeight: 1.6 }}>
          {displaySummary}
        </p>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 14,
            fontSize: 12,
            color: "rgba(180,207,232,0.55)",
          }}
        >
          <span>
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{attendeeCount}</strong> attendees
          </span>
          <span>
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{speechCount}</strong> speeches
          </span>
          <span>
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{totalDivisions}</strong> divisions
          </span>
        </div>
      </section>

      {/* Session chatbot */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={sectionTitle}>Ask this session</h3>
          <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.5)" }}>
            Chatbot grounded on the session transcript
          </span>
        </header>
        <AskSessionButton sessionId={trackerData?.slug ?? data?.session_id ?? sessionId} />
      </section>

      {trackerData && <TrackerSessionVerificationSection tracker={trackerData} />}

      {trackerData && <TrackerNarrativeSection tracker={trackerData} />}

      {/* Per-MLA participation */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h3 style={sectionTitle}>Who said what</h3>
          {trackerData && !data && (
            <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.55)" }}>
              Derived from tracker transcript speakers
            </span>
          )}
        </header>
        <DataTable
          columns={columns}
          rows={participationRows}
          getRowId={(r) => r.mla_id}
          pageSize={25}
        />
      </section>

      <Link href="/pro/sessions" style={{ color: "var(--vw-pro-cyan)", textDecoration: "none", fontSize: 13 }}>
        &#8592; Back to all sessions
      </Link>

      <FloatingChatbot />
    </div>
  );
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "";

  return (
    <ChatbotProvider>
      <SessionDetailContent sessionId={sessionId} />
    </ChatbotProvider>
  );
}
