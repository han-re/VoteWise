"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { DataTable, type Column } from "./components/DataTable";
import { KpiTile } from "./components/KpiTile";
import { useSetProPage } from "./components/ProPageContext";
import { RankingList } from "./components/RankingList";
import { TimeSeriesChart, type Series } from "./components/TimeSeriesChart";

interface DonationsByParty {
  party_id: string;
  party_name: string;
  party_color: string;
  total_gbp: number;
  donor_count: number;
}

interface AttendanceRow {
  mla_id: string;
  name: string;
  party_id: string;
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
}

interface SessionRow {
  session_id: string;
  date: string;
  title: string;
  agenda_summary: string;
  attendee_count: number;
  speech_count_total: number;
}

interface DonorPartyRef {
  party_id: string;
  party_name: string;
  total_gbp: number;
}

interface TopDonorRow {
  donor_name: string;
  donor_type: string;
  total_gbp: number;
  donation_count: number;
  parties: DonorPartyRef[];
}

interface TimeSeriesRow {
  period: string;
  party_id: string;
  total_gbp: number;
}

interface OverviewData {
  donationsByParty: DonationsByParty[];
  attendanceMLAs: AttendanceRow[];
  leaderboard: LeaderboardRow[];
  latestSessions: SessionRow[];
  topDonors: TopDonorRow[];
  donationsTimeSeries: TimeSeriesRow[];
}

const MANDATE_START = "2022-05-05";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const cyanLink: CSSProperties = {
  color: "var(--vw-pro-cyan)",
  fontSize: 12.5,
  textDecoration: "none",
  letterSpacing: "0.02em",
};

const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(180,207,232,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: 0,
};

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  padding: "16px 18px",
};

export default function ProOverviewPage() {
  useSetProPage("Overview", ["Overview"]);
  const router = useRouter();

  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const to = todayIso();
    Promise.all([
      fetch(`${base}/pro/donations/parties?from=${MANDATE_START}&to=${to}`).then((r) => r.json()),
      fetch(`${base}/pro/attendance/mlas`).then((r) => r.json()),
      fetch(`${base}/pro/engagement/leaderboard?limit=5`).then((r) => r.json()),
      fetch(`${base}/pro/sessions/latest?n=5`).then((r) => r.json()),
      fetch(`${base}/pro/donations/top-donors?limit=5`).then((r) => r.json()),
      fetch(`${base}/pro/donations/timeseries?granularity=quarter`).then((r) => r.json()),
    ])
      .then(([byParty, attendance, lb, latest, donors, ts]) => {
        setData({
          donationsByParty: byParty,
          attendanceMLAs: attendance,
          leaderboard: lb,
          latestSessions: latest,
          topDonors: donors,
          donationsTimeSeries: ts,
        });
      })
      .catch(() => setError(true));
  }, []);

  // Group timeseries by party for the stacked chart.
  const timeseriesByParty: Series[] = useMemo(() => {
    if (!data) return [];
    const colorByParty = new Map<string, string>();
    for (const p of data.donationsByParty) {
      colorByParty.set(p.party_id, p.party_color);
    }
    const buckets = new Map<string, Map<string, number>>();
    for (const r of data.donationsTimeSeries) {
      const inner = buckets.get(r.party_id) ?? new Map<string, number>();
      inner.set(r.period, (inner.get(r.period) ?? 0) + r.total_gbp);
      buckets.set(r.party_id, inner);
    }
    return [...buckets.entries()].map(([party_id, m]) => {
      const partyName = data.donationsByParty.find((p) => p.party_id === party_id)?.party_name ?? party_id;
      return {
        key:   party_id,
        label: partyName,
        color: colorByParty.get(party_id) ?? "#7dd3fc",
        data:  [...m.entries()].sort().map(([x, y]) => ({ x, y })),
      };
    });
  }, [data]);

  if (error) {
    return (
      <div style={cardStyle}>
        <p>Pro data could not be loaded. Try a hard refresh, or check that the backend is reachable.</p>
      </div>
    );
  }

  if (!data) {
    return <div style={{ color: "rgba(180,207,232,0.55)" }}>Loading dashboard…</div>;
  }

  // KPIs
  const totalDonations = data.donationsByParty.reduce((s, p) => s + p.total_gbp, 0);
  const sessionsInDataset = data.attendanceMLAs[0]?.total_sessions ?? 0;
  const avgAttendance = data.attendanceMLAs.length
    ? data.attendanceMLAs.reduce((s, r) => s + r.attendance_pct, 0) / data.attendanceMLAs.length
    : 0;
  const topEngagement = data.leaderboard[0];

  // Rankings
  const engagementRows = data.leaderboard.map((r) => ({
    id:       r.mla_id,
    name:     r.name,
    value:    r.engagement_score,
    color:    r.party_color,
    subtitle: `${r.party_name} • ${r.constituency}`,
  }));

  const donorRows = data.topDonors.map((d) => ({
    id:       d.donor_name,
    name:     d.donor_name,
    value:    d.total_gbp,
    color:    d.parties[0]?.party_id
      ? data.donationsByParty.find((p) => p.party_id === d.parties[0].party_id)?.party_color
      : undefined,
    subtitle: `${d.donor_type} • ${d.donation_count} donation${d.donation_count === 1 ? "" : "s"}`,
  }));

  // Sessions table
  const sessionColumns: Column<SessionRow>[] = [
    {
      key: "date",
      header: "Date",
      render: (r) => new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      sortValue: (r) => r.date,
      width: 130,
    },
    {
      key: "title",
      header: "Title",
      render: (r) => r.title,
      sortValue: (r) => r.title,
    },
    {
      key: "attendees",
      header: "Attendees",
      render: (r) => r.attendee_count,
      sortValue: (r) => r.attendee_count,
      numeric: true,
      width: 100,
    },
    {
      key: "speeches",
      header: "Total speeches",
      render: (r) => r.speech_count_total,
      sortValue: (r) => r.speech_count_total,
      numeric: true,
      width: 130,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* KPI row */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <KpiTile
          label="Total donations this mandate"
          value={totalDonations}
          valueFormat="currency"
          subtitle={`from ${MANDATE_START} to today`}
        />
        <KpiTile
          label="Sessions in dataset"
          value={sessionsInDataset}
          valueFormat="number"
          accent="cyan"
        />
        <KpiTile
          label="Avg attendance"
          value={Math.round(avgAttendance * 10) / 10}
          valueFormat="pct"
          accent="cyan"
          subtitle={`across ${data.attendanceMLAs.length} MLAs`}
        />
        <KpiTile
          label="Top engagement score"
          value={topEngagement ? Math.round(topEngagement.engagement_score * 10) / 10 : 0}
          valueFormat="number"
          subtitle={topEngagement ? topEngagement.name : ""}
        />
      </section>

      {/* Timeseries */}
      <section style={cardStyle}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={sectionTitle}>Donations over time, by party</h2>
          <Link href="/pro/donations" style={cyanLink}>View all →</Link>
        </header>
        <TimeSeriesChart series={timeseriesByParty} height={280} />
      </section>

      {/* Two ranking columns */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        <div style={cardStyle}>
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={sectionTitle}>Top engaged MLAs</h2>
            <Link href="/pro/attendance" style={cyanLink}>View all →</Link>
          </header>
          <RankingList
            rows={engagementRows}
            valueFormat="number"
            onRowClick={(r) => router.push(`/mla/${r.id}`)}
          />
        </div>

        <div style={cardStyle}>
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={sectionTitle}>Top donors</h2>
            <Link href="/pro/donations" style={cyanLink}>View all →</Link>
          </header>
          <RankingList rows={donorRows} valueFormat="currency" />
        </div>
      </section>

      {/* Latest sessions */}
      <section style={cardStyle}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={sectionTitle}>Latest Stormont sessions</h2>
          <Link href="/pro/sessions" style={cyanLink}>View all →</Link>
        </header>
        <DataTable
          columns={sessionColumns}
          rows={data.latestSessions}
          getRowId={(r) => r.session_id}
          pageSize={5}
          onRowClick={(r) => router.push(`/pro/sessions/${r.session_id}`)}
        />
      </section>
    </div>
  );
}
