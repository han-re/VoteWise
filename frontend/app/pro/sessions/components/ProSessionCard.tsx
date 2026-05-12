import Link from "next/link";
import type { CSSProperties } from "react";

export interface ProSessionRow {
  session_id: string;
  date: string;
  title: string;
  agenda_summary: string;
  attendee_count: number;
  speech_count_total: number;
  source?: "pro" | "tracker";
}

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "18px 20px",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProSessionCard({ session }: { session: ProSessionRow }) {
  return (
    <article style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Link
            href={`/pro/sessions/${session.session_id}`}
            className="pro-text-hover-only"
            style={{ color: "#e6eef7", textDecoration: "none", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}
          >
            {session.title}
          </Link>
        </div>
        <span style={{ color: "rgba(180,207,232,0.55)", fontSize: 12, fontFamily: "var(--vw-pro-mono)", whiteSpace: "nowrap" }}>
          {formatDate(session.date)}
        </span>
      </div>
      <p style={{ margin: 0, color: "rgba(205,220,236,0.7)", fontSize: 13.5, lineHeight: 1.55 }}>
        {session.agenda_summary}
      </p>
      <div style={{ display: "flex", gap: 18, fontSize: 12, color: "rgba(180,207,232,0.55)", marginTop: 4 }}>
        <span>
          <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{session.attendee_count}</strong> attendees
        </span>
        <span>
          <strong style={{ fontFamily: "var(--vw-pro-mono)", color: "#cddcec" }}>{session.speech_count_total}</strong> speeches
        </span>
        <Link
          href={`/pro/sessions/${session.session_id}`}
          className="pro-text-hover-only"
          style={{ color: "var(--vw-pro-cyan)", textDecoration: "none", marginLeft: "auto" }}
        >
          Open session &rarr;
        </Link>
      </div>
    </article>
  );
}
