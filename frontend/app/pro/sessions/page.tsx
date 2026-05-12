"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { useSetProPage } from "../components/ProPageContext";
import { ProSessionCard, type ProSessionRow } from "./components/ProSessionCard";

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  padding: "16px 18px",
};

export default function SessionsFeedPage() {
  useSetProPage("Stormont Sessions", ["Stormont Sessions"]);

  const [sessions, setSessions] = useState<ProSessionRow[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    Promise.all([
      fetch(`${base}/pro/sessions/latest?n=20`).then((r) => r.json()),
      fetch("/api/tracker-sessions").then((r) => r.json()),
    ])
      .then(([rows, trackerRows]) => {
        const merged = [...(trackerRows as ProSessionRow[]), ...(rows as ProSessionRow[])]
          .map((row) => ({ ...row, source: row.source ?? "pro" as const }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setSessions(merged);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: "rgba(180,207,232,0.55)" }}>Loading sessions…</div>;
  if (error) return <div style={cardStyle}>Sessions could not be loaded.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20.6 }}>New this week</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(205,220,236,0.6)", fontSize: 13 }}>
            Curated plenary sittings of the NI Assembly, now combined with transcript-backed tracker summaries.
          </p>
        </div>
        <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.55)", fontFamily: "var(--vw-pro-mono)" }}>
          Last updated 5 days ago
        </span>
      </header>

      <div style={{ display: "grid", gap: 14 }}>
        {sessions.map((s) => (
          <ProSessionCard key={s.session_id} session={s} />
        ))}
      </div>
    </div>
  );
}
