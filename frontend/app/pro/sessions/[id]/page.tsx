"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { DataTable, type Column } from "../../components/DataTable";
import { useSetProPage } from "../../components/ProPageContext";
import { ChatbotProvider, useChatbot } from "../../../components/tracker/ChatbotProvider";
import { FloatingChatbot } from "../../../components/tracker/FloatingChatbot";

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

interface SessionDetail {
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

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  padding: "16px 18px",
};

const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(180,207,232,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: 0,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionDetail | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const title = data?.title ?? "Session";
  useSetProPage(title, ["Stormont Sessions", title]);

  useEffect(() => {
    if (!sessionId) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/pro/sessions/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error("session not found");
        return r.json();
      })
      .then((d: SessionDetail) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [sessionId]);

  const columns: Column<SessionParticipant>[] = useMemo(() => [
    {
      key: "name",
      header: "MLA",
      render: (r) => (
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
  if (error || !data) return <div style={cardStyle}>Session not found.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Session header */}
      <section style={{ ...cardStyle, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--vw-pro-cyan)", letterSpacing: "0.04em" }}>
              {formatDate(data.date)}
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, color: "#e6eef7" }}>
              {data.title}
            </h2>
          </div>
          <a
            href={data.hansard_url}
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
        </div>
        <p style={{ marginTop: 12, color: "rgba(205,220,236,0.7)", fontSize: 14, lineHeight: 1.6 }}>
          {data.agenda_summary}
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
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{data.attendee_count}</strong> attendees
          </span>
          <span>
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{data.speech_count_total}</strong> speeches
          </span>
          <span>
            <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{data.total_divisions}</strong> divisions
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
        <AskSessionButton sessionId={data.session_id} />
      </section>

      {/* Per-MLA participation */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 10 }}>
          <h3 style={sectionTitle}>Who said what</h3>
        </header>
        <DataTable
          columns={columns}
          rows={data.mla_participation}
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
