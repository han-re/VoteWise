"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { useSetProPage } from "../components/ProPageContext";
import { ProSessionCard, type ProSessionRow } from "./components/ProSessionCard";

interface ProHealth {
  last_sessions_seeded_at: string | null;
}

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  padding: "16px 18px",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ageMs = Date.now() - Date.parse(iso);
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function SessionsFeedPage() {
  useSetProPage("Stormont Sessions", ["Stormont Sessions"]);

  const [sessions, setSessions] = useState<ProSessionRow[]>([]);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    Promise.all([
      fetch(`${base}/pro/sessions/latest?n=20`).then((r) => r.json()),
      fetch(`${base}/pro/health`).then((r) => (r.ok ? (r.json() as Promise<ProHealth>) : null)),
    ])
      .then(([rows, health]) => {
        setSessions(rows);
        setUpdated(health?.last_sessions_seeded_at ?? null);
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
          <h2 style={{ margin: 0, fontSize: 17 }}>What is new this week</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(205,220,236,0.6)", fontSize: 13 }}>
            Curated plenary sittings of the NI Assembly. Click into a session to see who attended and what they said.
          </p>
        </div>
        <span style={{ fontSize: 11.5, color: "rgba(180,207,232,0.55)", fontFamily: "var(--vw-pro-mono)" }}>
          Last updated {formatRelative(updated)}
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
