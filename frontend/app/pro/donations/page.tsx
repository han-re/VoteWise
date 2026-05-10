"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";

import { DataTable, type Column } from "../components/DataTable";
import { KpiTile } from "../components/KpiTile";
import { useSetProPage } from "../components/ProPageContext";
import { RankingList } from "../components/RankingList";
import { TimeSeriesChart, type Series } from "../components/TimeSeriesChart";

interface PartyTotal {
  party_id: string;
  party_name: string;
  party_color: string;
  total_gbp: number;
  donor_count: number;
}

interface TopDonorRow {
  donor_name: string;
  donor_type: string;
  total_gbp: number;
  donation_count: number;
  parties: { party_id: string; party_name: string; total_gbp: number }[];
}

interface TimeseriesRow {
  period: string;
  party_id: string;
  total_gbp: number;
}

interface CategoryRow {
  category: string;
  total_gbp: number;
  payment_count: number;
}

interface ProHealth {
  last_donations_seeded_at: string | null;
}

const ALL_PARTIES: { id: string; label: string; color: string }[] = [
  { id: "party_alliance",   label: "Alliance",  color: "#F6CB2F" },
  { id: "party_dup",        label: "DUP",       color: "#D4213D" },
  { id: "party_sinn_fein",  label: "Sinn Féin", color: "#326760" },
  { id: "party_uup",        label: "UUP",       color: "#48A5DD" },
  { id: "party_sdlp",       label: "SDLP",      color: "#2E9A41" },
  { id: "party_pbp",        label: "PBP",       color: "#C0392B" },
  { id: "party_tuv",        label: "TUV",       color: "#4A7AB5" },
];

const DONOR_TYPES = ["Individual", "Company", "Trade Union", "Other"];

type Granularity = "quarter" | "year";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoMinusMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
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

const explainer: CSSProperties = {
  fontSize: 13,
  color: "rgba(205,220,236,0.65)",
  lineHeight: 1.55,
  margin: "6px 0 14px",
};

function chip(active: boolean, color: string): CSSProperties {
  return {
    background: active ? color : "transparent",
    border: `1px solid ${active ? color : "var(--vw-pro-grid)"}`,
    color: active ? "#0b1426" : "rgba(205,220,236,0.7)",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    letterSpacing: "0.02em",
  };
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export default function DonationsPage() {
  useSetProPage("Donations & Spending", ["Donations & Spending"]);

  const [dateFrom, setDateFrom] = useState<string>(isoMinusMonths(12));
  const [dateTo, setDateTo] = useState<string>(isoToday());
  const [parties, setParties] = useState<Set<string>>(new Set(ALL_PARTIES.map((p) => p.id)));
  const [donorTypes, setDonorTypes] = useState<Set<string>>(new Set(DONOR_TYPES));
  const [granularity, setGranularity] = useState<Granularity>("quarter");
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);

  const [donParties, setDonParties] = useState<PartyTotal[]>([]);
  const [donTimeseries, setDonTimeseries] = useState<TimeseriesRow[]>([]);
  const [topDonorsRows, setTopDonorsRows] = useState<TopDonorRow[]>([]);
  const [spendParties, setSpendParties] = useState<PartyTotal[]>([]);
  const [spendTimeseries, setSpendTimeseries] = useState<TimeseriesRow[]>([]);
  const [spendCategories, setSpendCategories] = useState<CategoryRow[]>([]);
  const [error, setError] = useState(false);

  // Once on mount, default the date range to last 12 months from
  // last_donations_seeded_at — falls back to "today" if /pro/health is
  // unreachable (also the default we initialised with).
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/pro/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((h: ProHealth | null) => {
        if (!h?.last_donations_seeded_at) return;
        const seedDate = h.last_donations_seeded_at.slice(0, 10);
        const seed = new Date(seedDate);
        const minus12 = new Date(seed);
        minus12.setMonth(seed.getMonth() - 12);
        setDateFrom(minus12.toISOString().slice(0, 10));
        setDateTo(seedDate);
      })
      .catch(() => {});
  }, []);

  const partyIds = useMemo(() => [...parties].join(","), [parties]);
  const donorTypesParam = useMemo(() => [...donorTypes].join(","), [donorTypes]);

  // Re-fetch whenever filters change.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const dq = `from=${dateFrom}&to=${dateTo}`;
    const partyParam = parties.size === ALL_PARTIES.length || parties.size === 0
      ? ""
      : `&party_ids=${partyIds}`;
    const donorParam = donorTypes.size === DONOR_TYPES.length || donorTypes.size === 0
      ? ""
      : `&donor_type=${donorTypesParam}`;

    Promise.all([
      fetch(`${base}/pro/donations/parties?${dq}${donorParam}`).then((r) => r.json()),
      fetch(`${base}/pro/donations/timeseries?${dq}${partyParam}${donorParam}&granularity=${granularity}`).then((r) => r.json()),
      fetch(`${base}/pro/donations/top-donors?${dq}${partyParam}${donorParam}&limit=20`).then((r) => r.json()),
      fetch(`${base}/pro/spending/parties?${dq}${partyParam}`).then((r) => r.json()),
      fetch(`${base}/pro/spending/timeseries?${dq}${partyParam}&granularity=${granularity}`).then((r) => r.json()),
      fetch(`${base}/pro/spending/top-categories${parties.size === 1 ? `?party_id=${[...parties][0]}` : ""}`).then((r) => r.json()),
    ])
      .then(([donP, donTs, donors, spP, spTs, cats]) => {
        setDonParties(donP);
        setDonTimeseries(donTs);
        setTopDonorsRows(donors);
        setSpendParties(spP);
        setSpendTimeseries(spTs);
        setSpendCategories(cats);
      })
      .catch(() => setError(true));
  }, [dateFrom, dateTo, partyIds, donorTypesParam, granularity, parties, donorTypes]);

  const filteredDonByParty = donParties.filter((p) => parties.has(p.party_id));

  // KPIs (donations)
  const totalDonations = filteredDonByParty.reduce((s, p) => s + p.total_gbp, 0);
  const topParty = filteredDonByParty[0];
  const totalDonationsCount = topDonorsRows.reduce((s, d) => s + d.donation_count, 0);
  const top5Concentration = totalDonations > 0
    ? topDonorsRows.slice(0, 5).reduce((s, d) => s + d.total_gbp, 0) / totalDonations * 100
    : 0;

  // KPIs (spending)
  const totalSpending = spendParties.reduce((s, p) => s + p.total_gbp, 0);
  const topSpendingParty = spendParties[0];

  // Timeseries shape conversion.
  const donSeries: Series[] = useMemo(() => {
    const colorByParty = new Map(ALL_PARTIES.map((p) => [p.id, p.color]));
    const labelByParty = new Map(ALL_PARTIES.map((p) => [p.id, p.label]));
    const grouped = new Map<string, Map<string, number>>();
    for (const r of donTimeseries) {
      if (!parties.has(r.party_id)) continue;
      const inner = grouped.get(r.party_id) ?? new Map<string, number>();
      inner.set(r.period, (inner.get(r.period) ?? 0) + r.total_gbp);
      grouped.set(r.party_id, inner);
    }
    return [...grouped.entries()].map(([pid, m]) => ({
      key:   pid,
      label: labelByParty.get(pid) ?? pid,
      color: colorByParty.get(pid) ?? "#7dd3fc",
      data:  [...m.entries()].sort().map(([x, y]) => ({ x, y })),
    }));
  }, [donTimeseries, parties]);

  const spendSeries: Series[] = useMemo(() => {
    const colorByParty = new Map(ALL_PARTIES.map((p) => [p.id, p.color]));
    const labelByParty = new Map(ALL_PARTIES.map((p) => [p.id, p.label]));
    const grouped = new Map<string, Map<string, number>>();
    for (const r of spendTimeseries) {
      if (!parties.has(r.party_id)) continue;
      const inner = grouped.get(r.party_id) ?? new Map<string, number>();
      inner.set(r.period, (inner.get(r.period) ?? 0) + r.total_gbp);
      grouped.set(r.party_id, inner);
    }
    return [...grouped.entries()].map(([pid, m]) => ({
      key:   pid,
      label: labelByParty.get(pid) ?? pid,
      color: colorByParty.get(pid) ?? "#7dd3fc",
      data:  [...m.entries()].sort().map(([x, y]) => ({ x, y })),
    }));
  }, [spendTimeseries, parties]);

  // Donor table columns
  const donorColumns: Column<TopDonorRow>[] = [
    {
      key: "donor_name",
      header: "Donor",
      render: (r) => r.donor_name,
      sortValue: (r) => r.donor_name,
    },
    {
      key: "donor_type",
      header: "Type",
      render: (r) => r.donor_type,
      sortValue: (r) => r.donor_type,
      width: 110,
    },
    {
      key: "total_gbp",
      header: "Total",
      render: (r) => GBP.format(r.total_gbp),
      sortValue: (r) => r.total_gbp,
      numeric: true,
      width: 130,
    },
    {
      key: "donation_count",
      header: "Donations",
      render: (r) => r.donation_count,
      sortValue: (r) => r.donation_count,
      numeric: true,
      width: 100,
    },
    {
      key: "parties",
      header: "Recipients",
      render: (r) => r.parties.length,
      sortValue: (r) => r.parties.length,
      numeric: true,
      width: 100,
    },
  ];

  const recipientRows = filteredDonByParty.map((p) => ({
    id:    p.party_id,
    name:  p.party_name,
    value: p.total_gbp,
    color: p.party_color,
    subtitle: `${p.donor_count} unique donor${p.donor_count === 1 ? "" : "s"}`,
  }));

  const spendRecipientRows = spendParties
    .filter((p) => parties.has(p.party_id))
    .map((p) => ({
      id:    p.party_id,
      name:  p.party_name,
      value: p.total_gbp,
      color: p.party_color,
      subtitle: `${p.donor_count} supplier${p.donor_count === 1 ? "" : "s"}`,
    }));

  function toggleParty(id: string) {
    setParties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleDonorType(t: string) {
    setDonorTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  if (error) {
    return <div style={cardStyle}>Pro data could not be loaded.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Sticky filter bar */}
      <section
        style={{
          position: "sticky",
          top: 76,
          zIndex: 5,
          background: "var(--vw-pro-surface)",
          border: "1px solid var(--vw-pro-grid)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        <label style={{ fontSize: 12, color: "rgba(180,207,232,0.7)" }}>
          From{" "}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              background: "var(--vw-card-bg)",
              border: "1px solid var(--vw-pro-grid)",
              color: "#cddcec",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 12,
              colorScheme: "dark",
            }}
          />
        </label>
        <label style={{ fontSize: 12, color: "rgba(180,207,232,0.7)" }}>
          To{" "}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              background: "var(--vw-card-bg)",
              border: "1px solid var(--vw-pro-grid)",
              color: "#cddcec",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 12,
              colorScheme: "dark",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ALL_PARTIES.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleParty(p.id)}
              style={chip(parties.has(p.id), p.color)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DONOR_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleDonorType(t)}
              style={chip(donorTypes.has(t), "var(--vw-pro-cyan)")}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={() => setGranularity("quarter")}
            style={chip(granularity === "quarter", "var(--vw-pro-cyan)")}
          >
            Quarterly
          </button>
          <button
            onClick={() => setGranularity("year")}
            style={chip(granularity === "year", "var(--vw-pro-cyan)")}
          >
            Yearly
          </button>
        </div>
      </section>

      {/* Donations explainer */}
      <div>
        <h2 style={{ ...sectionTitle, fontSize: 16, textTransform: "none", letterSpacing: 0, color: "#e6eef7" }}>
          Donations
        </h2>
        <p style={explainer}>
          Donations are recorded with the Electoral Commission when they exceed £1,000.
          The dataset covers individuals, companies, trade unions, public funds, and party
          loans converted into donations. Coverage starts in 2010.
        </p>
      </div>

      {/* Donations KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <KpiTile label="Total raised" value={totalDonations} valueFormat="currency" />
        <KpiTile
          label="Top recipient"
          value={topParty ? topParty.party_name : "—"}
          subtitle={topParty ? GBP.format(topParty.total_gbp) : ""}
          accent="cyan"
        />
        <KpiTile
          label="Top-5 donor concentration"
          value={Math.round(top5Concentration * 10) / 10}
          valueFormat="pct"
          accent="cyan"
        />
        <KpiTile
          label="Donation rows"
          value={totalDonationsCount}
          valueFormat="number"
        />
      </section>

      {/* Donations timeseries */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 10 }}>
          <h3 style={sectionTitle}>Donations over time</h3>
        </header>
        <TimeSeriesChart series={donSeries} height={280} />
      </section>

      {/* Two-column: top donors + recipients */}
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 14 }}>
        <div style={cardStyle}>
          <header style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={sectionTitle}>Top donors</h3>
            <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.5)" }}>
              Click a row for the per-party breakdown
            </span>
          </header>
          <DataTable
            columns={donorColumns}
            rows={topDonorsRows}
            getRowId={(r) => r.donor_name}
            pageSize={10}
            searchFieldKey="donor_name"
            searchAccessor={(r) => r.donor_name}
            searchPlaceholder="Search donors…"
            onRowClick={(r) => setExpandedDonor((prev) => (prev === r.donor_name ? null : r.donor_name))}
          />
          {expandedDonor && (() => {
            const row = topDonorsRows.find((r) => r.donor_name === expandedDonor);
            if (!row) return null;
            return (
              <div style={{ marginTop: 14, padding: 14, border: "1px solid var(--vw-pro-grid)", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <strong>{row.donor_name}</strong>
                  <button
                    onClick={() => setExpandedDonor(null)}
                    style={{ background: "transparent", border: "none", color: "var(--vw-pro-cyan)", cursor: "pointer", fontSize: 12 }}
                  >
                    Close
                  </button>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {row.parties.map((p) => (
                    <li key={p.party_id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                      <span>{p.party_name}</span>
                      <span style={{ fontFamily: "var(--vw-pro-mono)" }}>{GBP.format(p.total_gbp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>

        <div style={cardStyle}>
          <header style={{ marginBottom: 10 }}>
            <h3 style={sectionTitle}>Top recipients</h3>
          </header>
          <RankingList rows={recipientRows} valueFormat="currency" />
        </div>
      </section>

      <hr style={{ border: 0, borderTop: "1px solid var(--vw-pro-grid)", margin: "8px 0" }} />

      {/* Spending explainer */}
      <div>
        <h2 style={{ ...sectionTitle, fontSize: 16, textTransform: "none", letterSpacing: 0, color: "#e6eef7" }}>
          Spending
        </h2>
        <p style={explainer}>
          Spending here covers campaign expenditure that parties must report to the Electoral
          Commission for each regulated election period. It excludes routine party operations
          outside an election window.
        </p>
      </div>

      {/* Spending KPIs */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <KpiTile label="Total spent" value={totalSpending} valueFormat="currency" />
        <KpiTile
          label="Top spender"
          value={topSpendingParty ? topSpendingParty.party_name : "—"}
          subtitle={topSpendingParty ? GBP.format(topSpendingParty.total_gbp) : ""}
          accent="cyan"
        />
        <KpiTile
          label="Categories"
          value={spendCategories.length}
          valueFormat="number"
          accent="cyan"
        />
        <KpiTile
          label="Payments"
          value={spendCategories.reduce((s, c) => s + c.payment_count, 0)}
          valueFormat="number"
        />
      </section>

      {/* Spending timeseries */}
      <section style={cardStyle}>
        <header style={{ marginBottom: 10 }}>
          <h3 style={sectionTitle}>Campaign spending over time</h3>
        </header>
        <TimeSeriesChart series={spendSeries} height={260} />
      </section>

      {/* Two-column: spending categories + recipients */}
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 14 }}>
        <div style={cardStyle}>
          <header style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={sectionTitle}>Spending by category</h3>
            <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.5)" }}>
              {parties.size === 1 ? `Filtered to ${[...parties][0].replace("party_", "")}` : "All parties combined"}
            </span>
          </header>
          <DataTable
            columns={[
              {
                key: "category",
                header: "Category",
                render: (r: CategoryRow) => r.category,
                sortValue: (r) => r.category,
              },
              {
                key: "total",
                header: "Total",
                render: (r) => GBP.format(r.total_gbp),
                sortValue: (r) => r.total_gbp,
                numeric: true,
                width: 130,
              },
              {
                key: "payments",
                header: "Payments",
                render: (r) => r.payment_count,
                sortValue: (r) => r.payment_count,
                numeric: true,
                width: 100,
              },
            ]}
            rows={spendCategories}
            getRowId={(r) => r.category}
            pageSize={10}
          />
        </div>

        <div style={cardStyle}>
          <header style={{ marginBottom: 10 }}>
            <h3 style={sectionTitle}>Top spenders</h3>
          </header>
          <RankingList rows={spendRecipientRows} valueFormat="currency" />
        </div>
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
          Data source:{" "}
          <a
            href="https://search.electoralcommission.org.uk/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--vw-pro-cyan)" }}
          >
            search.electoralcommission.org.uk
          </a>
          . NI register, 2010 to present.
        </span>
        <Link href="/pro" style={{ color: "var(--vw-pro-cyan)", textDecoration: "none" }}>
          ← Back to overview
        </Link>
      </footer>

    </div>
  );
}
