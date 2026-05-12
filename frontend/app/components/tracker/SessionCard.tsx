import Link from "next/link";
import type { SessionCardMeta } from "../../tracker/_types";

const SESSION_TYPE_LABEL: Record<string, string> = {
  plenary: "Plenary",
  committee: "Committee",
  questions: "Questions",
  debate: "Debate",
};

export function SessionCard({ session, featured = false }: { session: SessionCardMeta; featured?: boolean }) {
  const label = SESSION_TYPE_LABEL[session.session_type] ?? session.session_type;
  const date = new Date(session.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (featured) {
    return (
      <Link
        href={`/tracker/sessions/${session.slug}`}
        style={{
          display: "block",
          background: "rgba(11,20,38,0.88)",
          border: "1px solid rgba(180,207,232,0.13)",
          borderRadius: "16px",
          padding: "2.2rem 2.4rem 2rem",
          textDecoration: "none",
          color: "inherit",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "inset 0 1px 0 rgba(180,207,232,0.08), 0 20px 60px rgba(0,0,0,0.5)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, #e8962a, transparent)",
          }}
          aria-hidden="true"
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              color: "#e8962a",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "rgba(232,150,42,0.1)",
              border: "1px solid rgba(232,150,42,0.2)",
              borderRadius: "4px",
              padding: "0.15rem 0.5rem",
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(180,207,232,0.55)" }}>{date}</span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-source-serif, Georgia, serif)",
            fontSize: "clamp(1.3rem, 3vw, 2rem)",
            fontWeight: 700,
            color: "#b4cfe8",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            marginBottom: "0.9rem",
          }}
        >
          {session.headline}
        </h2>

        {session.key_topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.8rem" }}>
            {session.key_topics.slice(0, 5).map((t) => (
              <TopicTag key={t} label={t} />
            ))}
          </div>
        )}

        <p
          style={{
            marginTop: "1.2rem",
            fontSize: "0.72rem",
            color: "#e8962a",
            fontWeight: 600,
          }}
        >
          Read transcript analysis →
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/tracker/sessions/${session.slug}`}
      style={{
        display: "block",
        background: "rgba(11,20,38,0.82)",
        border: "1px solid rgba(180,207,232,0.09)",
        borderRadius: "12px",
        padding: "1.3rem 1.4rem",
        textDecoration: "none",
        color: "inherit",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            color: "rgba(180,207,232,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        <span style={{ color: "rgba(180,207,232,0.2)", fontSize: "0.65rem" }}>·</span>
        <span style={{ fontSize: "0.7rem", color: "rgba(180,207,232,0.45)" }}>{date}</span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-source-serif, Georgia, serif)",
          fontSize: "1rem",
          fontWeight: 600,
          color: "rgba(215,228,242,0.9)",
          lineHeight: 1.4,
          marginBottom: "0.65rem",
        }}
      >
        {session.headline}
      </p>
      {session.key_topics.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {session.key_topics.slice(0, 3).map((t) => (
            <TopicTag key={t} label={t} small />
          ))}
        </div>
      )}
    </Link>
  );
}

function TopicTag({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span
      style={{
        padding: small ? "0.18rem 0.5rem" : "0.22rem 0.6rem",
        borderRadius: "5px",
        fontSize: small ? "0.65rem" : "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "rgba(180,207,232,0.6)",
        background: "rgba(180,207,232,0.07)",
        border: "1px solid rgba(180,207,232,0.11)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
