"use client";

import { useEffect } from "react";
import { useChatbot } from "../../../components/tracker/ChatbotProvider";
import type { ExtendedSummary, NotableMoment } from "../../_types";

interface Props {
  slug: string;
  extended: ExtendedSummary;
  moments: NotableMoment[];
}

export function SessionDetail({ slug, extended, moments }: Props) {
  const { openFor, onFocusCitation } = useChatbot();

  // Keep citation handler registered even without transcript — chatbot still works
  useEffect(() => {
    return onFocusCitation(() => {
      // No transcript anchors — scroll to top of content instead
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [onFocusCitation]);

  return (
    <div style={{ padding: "2rem 2.2rem 2.6rem" }}>

      {/* Ask the transcript button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
        <button
          onClick={() => openFor(slug)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            background: "rgba(232,150,42,0.1)",
            border: "1px solid rgba(232,150,42,0.28)",
            borderRadius: "8px",
            padding: "0.45rem 0.9rem",
            cursor: "pointer",
            fontSize: "0.78rem",
            color: "#e8962a",
            fontWeight: 700,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask about this session
        </button>
      </div>

      {/* Overview */}
      {extended.overview && (
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionHeading>Overview</SectionHeading>
          {extended.overview.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} style={PARA_STYLE}>{para}</p>
          ))}
        </section>
      )}

      {/* Key debates */}
      {extended.key_debates.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionHeading>What was discussed</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {extended.key_debates.map((debate, i) => (
              <div
                key={i}
                style={{
                  borderLeft: "3px solid rgba(180,207,232,0.18)",
                  paddingLeft: "1.2rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#b4cfe8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {debate.topic}
                </p>
                {debate.summary.split("\n\n").filter(Boolean).map((para, j) => (
                  <p key={j} style={PARA_STYLE}>{para}</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outcomes */}
      {extended.outcomes && (
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionHeading>Decisions and outcomes</SectionHeading>
          {extended.outcomes.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} style={PARA_STYLE}>{para}</p>
          ))}
        </section>
      )}

      {/* Notable moments */}
      {moments.length > 0 && (
        <section>
          <SectionHeading>Notable moments</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
            {moments.map((moment, i) => (
              <NotableMomentCard key={i} moment={moment} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "0.68rem",
        fontWeight: 700,
        color: "rgba(180,207,232,0.4)",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        marginBottom: "1.1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid rgba(180,207,232,0.07)",
      }}
    >
      {children}
    </h2>
  );
}

function NotableMomentCard({ moment }: { moment: NotableMoment }) {
  const hasAlignmentConflict =
    moment.alignment_note.toLowerCase().includes("diverge") ||
    moment.alignment_note.toLowerCase().includes("contrast") ||
    moment.alignment_note.toLowerCase().includes("unusual") ||
    moment.alignment_note.toLowerCase().includes("surprising") ||
    moment.alignment_note.toLowerCase().includes("against");

  return (
    <div
      style={{
        background: "rgba(180,207,232,0.03)",
        border: "1px solid rgba(180,207,232,0.09)",
        borderRadius: "12px",
        padding: "1.3rem 1.4rem",
      }}
    >
      {/* Speaker line */}
      {moment.speaker && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(180,207,232,0.1)",
              border: "1px solid rgba(180,207,232,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#b4cfe8",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {moment.speaker.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(215,228,242,0.9)", margin: 0, lineHeight: 1.2 }}>
              {moment.speaker}
            </p>
            {moment.party && moment.party !== "Unknown" && (
              <p style={{ fontSize: "0.72rem", color: "rgba(180,207,232,0.45)", margin: 0 }}>
                {moment.party}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quote */}
      <blockquote
        style={{
          borderLeft: "3px solid rgba(232,150,42,0.5)",
          paddingLeft: "1rem",
          margin: "0 0 0.9rem",
          fontFamily: "var(--font-source-serif, Georgia, serif)",
          fontStyle: "italic",
          fontSize: "0.95rem",
          color: "rgba(215,228,242,0.8)",
          lineHeight: 1.7,
        }}
      >
        &ldquo;{moment.quote}&rdquo;
      </blockquote>

      {/* Context */}
      {moment.context && (
        <p style={{ fontSize: "0.78rem", color: "rgba(180,207,232,0.5)", lineHeight: 1.6, margin: "0 0 0.6rem" }}>
          {moment.context}
        </p>
      )}

      {/* Alignment note */}
      {moment.alignment_note && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            background: hasAlignmentConflict ? "rgba(239,68,68,0.06)" : "rgba(180,207,232,0.05)",
            borderRadius: "7px",
            border: `1px solid ${hasAlignmentConflict ? "rgba(239,68,68,0.15)" : "rgba(180,207,232,0.08)"}`,
          }}
        >
          <span style={{ fontSize: "0.75rem", flexShrink: 0, marginTop: "0.05rem" }} aria-hidden="true">
            {hasAlignmentConflict ? "⚠" : "✓"}
          </span>
          <p style={{ fontSize: "0.75rem", color: hasAlignmentConflict ? "rgba(239,68,68,0.8)" : "rgba(180,207,232,0.5)", margin: 0, lineHeight: 1.55 }}>
            {moment.alignment_note}
          </p>
        </div>
      )}
    </div>
  );
}

const PARA_STYLE: React.CSSProperties = {
  fontSize: "0.92rem",
  color: "rgba(215,228,242,0.72)",
  lineHeight: 1.85,
  marginBottom: "0.9rem",
};
