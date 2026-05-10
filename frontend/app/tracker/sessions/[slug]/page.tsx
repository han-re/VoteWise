import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSessionSummary,
  getSessionMetadata,
  listSessionSlugs,
} from "../../_data";
import { SessionDetail } from "./SessionDetail";
import type { ExtendedSummary, NotableMoment } from "../../_types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return listSessionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const summary = getSessionSummary(slug);
  return {
    title: summary
      ? `${summary.card_summary} — MLA Tracker`
      : `Session ${slug} — MLA Tracker`,
    description: summary?.headline_summary ?? "",
  };
}

function normaliseExtended(raw: ExtendedSummary | string): ExtendedSummary {
  if (typeof raw === "string") {
    return { overview: raw, key_debates: [], outcomes: "" };
  }
  return raw;
}

function normaliseNotableMoments(raw: NotableMoment[] | string[]): NotableMoment[] {
  if (!raw.length) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((s) => ({
      speaker: "",
      party: "",
      quote: s,
      context: "",
      alignment_note: "",
    }));
  }
  return raw as NotableMoment[];
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  plenary: "Plenary session",
  committee: "Committee sitting",
  questions: "Question time",
  debate: "Debate",
};

export default async function SessionPage({ params }: Props) {
  const { slug } = await params;
  const summary = getSessionSummary(slug);
  const meta = getSessionMetadata(slug);

  if (!summary) notFound();

  const typeLabel = SESSION_TYPE_LABEL[summary.session_type] ?? summary.session_type;
  const extended = normaliseExtended(summary.extended_summary as ExtendedSummary | string);
  const moments = normaliseNotableMoments(summary.notable_moments as NotableMoment[] | string[]);
  const date = new Date(summary.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

      {/* Breadcrumb */}
      <nav
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem", fontSize: "0.78rem" }}
        aria-label="Breadcrumb"
      >
        <Link href="/tracker" style={{ color: "rgba(180,207,232,0.5)", textDecoration: "none" }}>
          MLA Tracker
        </Link>
        <span style={{ color: "rgba(180,207,232,0.2)" }} aria-hidden="true">/</span>
        <span style={{ color: "#b4cfe8" }}>Session report</span>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.2rem" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#e8962a",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              background: "rgba(232,150,42,0.12)",
              border: "1px solid rgba(232,150,42,0.25)",
              borderRadius: "5px",
              padding: "0.2rem 0.6rem",
            }}
          >
            {typeLabel}
          </span>
          <span style={{ fontSize: "0.78rem", color: "rgba(180,207,232,0.5)" }}>{date}</span>
          {summary.duration_estimate_minutes > 0 && (
            <span style={{ fontSize: "0.75rem", color: "rgba(180,207,232,0.3)" }}>
              · ~{summary.duration_estimate_minutes} min
            </span>
          )}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-source-serif, Georgia, serif)",
            fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
            fontWeight: 700,
            color: "#cddcec",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: "1.2rem",
          }}
        >
          {summary.card_summary}
        </h1>

        {/* Topic tags */}
        {summary.key_topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2rem" }}>
            {summary.key_topics.map((t) => (
              <span
                key={t}
                style={{
                  padding: "0.25rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "rgba(180,207,232,0.6)",
                  background: "rgba(180,207,232,0.07)",
                  border: "1px solid rgba(180,207,232,0.12)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* At-a-glance row */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {/* Speakers */}
          {summary.key_speakers.length > 0 && (
            <div
              style={{
                flex: "1 1 260px",
                background: "rgba(11,20,38,0.7)",
                border: "1px solid rgba(180,207,232,0.09)",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
              }}
            >
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(180,207,232,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.7rem" }}>
                Key speakers
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {summary.key_speakers.slice(0, 6).map((sp) => (
                  <div key={sp.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(215,228,242,0.85)" }}>{sp.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(180,207,232,0.4)" }}>{sp.party}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content card */}
      <div
        style={{
          background: "rgba(11,20,38,0.82)",
          border: "1px solid rgba(180,207,232,0.1)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        {/* Top accent */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #e8962a, transparent)", opacity: 0.7 }} aria-hidden="true" />

        <SessionDetail
          slug={slug}
          extended={extended}
          moments={moments}
        />
      </div>
    </main>
  );
}
