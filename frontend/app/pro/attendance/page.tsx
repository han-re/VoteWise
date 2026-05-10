"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { DataTable, type Column } from "../components/DataTable";
import { KpiTile } from "../components/KpiTile";
import { MethodologyFootnote } from "../components/MethodologyFootnote";
import { useSetProPage } from "../components/ProPageContext";
import { RankingList } from "../components/RankingList";

interface AttendanceRow {
  mla_id: string;
  name: string;
  party_id: string;
  party_name?: string;
  party_color: string;
  constituency: string;
  attended_sessions: number;
  total_sessions: number;
  attendance_pct: number;
}

interface LeaderboardRow {
  mla_id: string;
  name: string;
  party_id: string;
  party_name: string;
  party_color: string;
  constituency: string;
  engagement_score: number;
  attendance_pct: number;
  speech_count_total: number;
  division_votes_total: number;
  written_questions_total: number;
}

interface ProHealth {
  last_sessions_seeded_at: string | null;
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

export default function AttendancePage() {
  useSetProPage("Attendance & Engagement", ["Attendance & Engagement"]);

  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [seededAt, setSeededAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    Promise.all([
      fetch(`${base}/pro/attendance/mlas`).then((r) => r.json()),
      fetch(`${base}/pro/engagement/leaderboard?limit=50`).then((r) => r.json()),
      fetch(`${base}/pro/health`).then((r) => (r.ok ? r.json() as Promise<ProHealth> : null)),
    ])
      .then(([att, lb, health]) => {
        setAttendance(att);
        setLeaderboard(lb);
        setSeededAt(health?.last_sessions_seeded_at ?? null);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // Empty state for when the Stormont seed has not been run yet on this Mongo.
  if (!loading && attendance.length === 0) {
    return (
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>No session data loaded</h2>
        <p style={{ color: "rgba(205,220,236,0.7)", lineHeight: 1.6 }}>
          Stormont session data not yet loaded. Run{" "}
          <code style={{ background: "rgba(125,211,252,0.1)", padding: "2px 6px", borderRadius: 4, color: "var(--vw-pro-cyan)" }}>
            POST /admin/seed-stormont-sessions
          </code>{" "}
          to ingest the curated plenary sittings.
        </p>
      </div>
    );
  }

  if (error) {
    return <div style={cardStyle}>Pro data could not be loaded.</div>;
  }
  if (loading) {
    return <div style={{ color: "rgba(180,207,232,0.55)" }}>Loading attendance data…</div>;
  }

  // KPIs
  const overallAttendance = attendance.length
    ? attendance.reduce((s, r) => s + r.attendance_pct, 0) / attendance.length
    : 0;
  const sortedByAttendance = [...attendance].sort((a, b) => b.attendance_pct - a.attendance_pct);
  const bestAttender = sortedByAttendance[0];
  const worstAttender = sortedByAttendance[sortedByAttendance.length - 1];
  const totalSpeeches = leaderboard.reduce((s, r) => s + r.speech_count_total, 0);

  // Rankings (all 13 real MLAs, sorted desc, side-by-side)
  const attendanceRows = sortedByAttendance.map((r) => ({
    id:       r.mla_id,
    name:     r.name,
    value:    r.attendance_pct,
    color:    r.party_color,
    subtitle: r.constituency,
  }));

  const engagementRows = [...leaderboard]
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .map((r) => ({
      id:       r.mla_id,
      name:     r.name,
      value:    r.engagement_score,
      color:    r.party_color,
      subtitle: `${r.party_name} • ${r.constituency}`,
    }));

  // Sortable per-MLA table
  const tableColumns: Column<LeaderboardRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <Link
          href={`/mla/${r.mla_id}`}
          style={{ color: "#cddcec", textDecoration: "none" }}
        >
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
      key: "constituency",
      header: "Constituency",
      render: (r) => r.constituency,
      sortValue: (r) => r.constituency,
    },
    {
      key: "attendance",
      header: "Attendance %",
      render: (r) => `${r.attendance_pct}%`,
      sortValue: (r) => r.attendance_pct,
      numeric: true,
      width: 130,
    },
    {
      key: "speeches",
      header: "Speeches",
      render: (r) => r.speech_count_total,
      sortValue: (r) => r.speech_count_total,
      numeric: true,
      width: 100,
    },
    {
      key: "divisions",
      header: "Division votes",
      render: (r) => r.division_votes_total,
      sortValue: (r) => r.division_votes_total,
      numeric: true,
      width: 130,
    },
    {
      key: "written",
      header: "Written Qs",
      render: (r) => r.written_questions_total,
      sortValue: (r) => r.written_questions_total,
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
  ];

  // Dataset coverage labels.
  const totalSessions = attendance[0]?.total_sessions ?? 0;
  const updatedLabel = seededAt
    ? new Date(seededAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <KpiTile
          label="Overall attendance"
          value={Math.round(overallAttendance * 10) / 10}
          valueFormat="pct"
          subtitle={`${attendance.length} MLAs • ${totalSessions} sessions`}
        />
        <KpiTile
          label="Best attender"
          value={bestAttender ? bestAttender.name : "—"}
          accent="cyan"
          subtitle={bestAttender ? `${bestAttender.attendance_pct}%` : ""}
        />
        <KpiTile
          label="Lowest attender"
          value={worstAttender ? worstAttender.name : "—"}
          accent="cyan"
          subtitle={worstAttender ? `${worstAttender.attendance_pct}%` : ""}
        />
        <KpiTile
          label="Total speeches"
          value={totalSpeeches}
          valueFormat="number"
        />
      </section>

      {/* Two ranking columns */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <div style={cardStyle}>
          <header style={{ marginBottom: 10 }}>
            <h2 style={sectionTitle}>By attendance %</h2>
          </header>
          <RankingList rows={attendanceRows} valueFormat="pct" />
        </div>
        <div style={cardStyle}>
          <header style={{ marginBottom: 10 }}>
            <h2 style={sectionTitle}>By engagement score</h2>
          </header>
          <RankingList rows={engagementRows} valueFormat="number" />
        </div>
      </section>

      {/* Sortable detail table */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={sectionTitle}>Per-MLA breakdown</h2>
          <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.5)" }}>
            Click an MLA to open their profile
          </span>
        </header>
        <DataTable
          columns={tableColumns}
          rows={leaderboard}
          getRowId={(r) => r.mla_id}
          pageSize={25}
          searchFieldKey="name"
          searchAccessor={(r) => `${r.name} ${r.party_name} ${r.constituency}`}
          searchPlaceholder="Search MLAs…"
        />
      </section>

      {/* Methodology */}
      <section>
        <MethodologyFootnote src="/methodology.md" />
      </section>

      {/* Footer */}
      <footer
        style={{
          fontSize: 11.5,
          color: "rgba(180,207,232,0.5)",
          paddingTop: 12,
          borderTop: "1px solid var(--vw-pro-grid)",
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
        }}
      >
        <span>
          Dataset: {totalSessions} curated plenary sittings of the NI Assembly. Last updated {updatedLabel}.
        </span>
        <Link href="/pro" style={{ color: "var(--vw-pro-cyan)", textDecoration: "none" }}>
          ← Back to overview
        </Link>
      </footer>
    </div>
  );
}
