import Link from "next/link";
import type { Metadata } from "next";
import { getReports, getReport } from "../_data";
import type { ReportSection, CalloutType } from "../_types";

export const metadata: Metadata = {
  title: "Analysis — MLA Tracker",
  description:
    "In-depth analysis of how Stormont politicians are matching their voting records against what they promised.",
};

const CALLOUT_META: Record<
  CalloutType,
  { label: string; color: string; bg: string }
> = {
  finding: {
    label: "Key finding",
    color: "#e8962a",
    bg: "rgba(232,150,42,0.06)",
  },
  caveat: {
    label: "Worth noting",
    color: "rgba(180,207,232,0.5)",
    bg: "rgba(180,207,232,0.04)",
  },
  quote: {
    label: "Quote",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.05)",
  },
};

function Callout({
  content,
  callout_type = "finding",
}: {
  content: string;
  callout_type?: CalloutType;
}) {
  const meta = CALLOUT_META[callout_type];
  return (
    <div
      style={{
        background: meta.bg,
        border: `1px solid ${meta.color}28`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: "10px",
        padding: "1.1rem 1.3rem",
        margin: "1.5rem 0",
      }}
      role="note"
      aria-label={meta.label}
    >
      <p
        style={{
          fontSize: "0.63rem",
          fontWeight: 700,
          color: meta.color,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        {meta.label}
      </p>
      <p
        style={{
          fontSize: "0.84rem",
          color: "rgba(215,228,242,0.75)",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {content}
      </p>
    </div>
  );
}

function ReportBody({ sections }: { sections: ReportSection[] }) {
  return (
    <div>
      {sections.map((section, i) => {
        if (section.type === "heading") {
          return (
            <h2
              key={i}
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                fontWeight: 800,
                color: "#b4cfe8",
                letterSpacing: "-0.02em",
                marginTop: "2.2rem",
                marginBottom: "0.75rem",
                lineHeight: 1.25,
              }}
            >
              {section.content}
            </h2>
          );
        }
        if (section.type === "callout") {
          return (
            <Callout
              key={i}
              content={section.content}
              callout_type={section.callout_type}
            />
          );
        }
        return (
          <p
            key={i}
            style={{
              fontSize: "0.85rem",
              color: "rgba(180,207,232,0.55)",
              lineHeight: 1.8,
              marginBottom: "1rem",
            }}
          >
            {section.content}
          </p>
        );
      })}
    </div>
  );
}

function TopicTag({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "0.2rem 0.55rem",
        borderRadius: "6px",
        fontSize: "0.6rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "rgba(180,207,232,0.5)",
        background: "rgba(180,207,232,0.07)",
        border: "1px solid rgba(180,207,232,0.1)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default function AnalysisPage() {
  const { reports } = getReports();

  // Render each report's full content inline — no separate detail pages needed
  const fullReports = reports
    .map((meta) => ({ meta, content: getReport(meta.slug) }))
    .filter((r) => r.content !== null);

  return (
    <main
      style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1.5rem 5rem" }}
    >
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "2.5rem",
          fontSize: "0.72rem",
        }}
        aria-label="Breadcrumb"
      >
        <Link
          href="/tracker"
          style={{ color: "rgba(180,207,232,0.4)", textDecoration: "none" }}
        >
          MLA Tracker
        </Link>
        <span style={{ color: "rgba(180,207,232,0.18)" }} aria-hidden="true">
          /
        </span>
        <span style={{ color: "#b4cfe8" }}>Analysis</span>
      </nav>

      {/* Title */}
      <p
        style={{
          color: "rgba(180,207,232,0.38)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        Data analysis
      </p>
      <h1
        style={{
          fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          fontWeight: 900,
          color: "#b4cfe8",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "0.5rem",
        }}
      >
        What the data actually shows
      </h1>
      <div
        style={{
          width: "48px",
          height: "2px",
          margin: "0 0 1rem",
          background: "linear-gradient(90deg, transparent, #e8962a, transparent)",
          borderRadius: "2px",
        }}
        aria-hidden="true"
      />
      <p
        style={{
          fontSize: "0.84rem",
          color: "rgba(180,207,232,0.45)",
          lineHeight: 1.7,
          marginBottom: "3rem",
        }}
      >
        These reports go beyond the individual MLA scores to find the bigger
        patterns. Every claim links to a primary source. Every number is
        reproducible from the raw data published on each MLA and party page.
      </p>

      {fullReports.length === 0 ? (
        <p style={{ color: "rgba(180,207,232,0.35)", fontSize: "0.84rem" }}>
          No analysis published yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {fullReports.map(({ meta, content }) => (
            <article
              key={meta.slug}
              aria-label={meta.title}
            >
              {/* Article header */}
              <header style={{ marginBottom: "1.8rem" }}>
                <p
                  style={{
                    fontSize: "0.63rem",
                    color: "#e8962a",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "0.7rem",
                  }}
                >
                  {new Date(meta.published).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h2
                  style={{
                    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                    fontWeight: 900,
                    color: "#b4cfe8",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    marginBottom: "0.5rem",
                  }}
                >
                  {meta.title}
                </h2>
                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "rgba(180,207,232,0.45)",
                    lineHeight: 1.6,
                    marginBottom: "0.9rem",
                  }}
                >
                  {meta.subtitle}
                </p>
                {meta.topics.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {meta.topics.map((t) => (
                      <TopicTag key={t} label={t} />
                    ))}
                  </div>
                )}
              </header>

              {/* Article body */}
              <div
                style={{
                  background: "rgba(11,20,38,0.82)",
                  border: "1px solid rgba(180,207,232,0.11)",
                  borderRadius: "16px",
                  padding: "2rem 2rem 2.2rem",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow:
                    "inset 0 1px 0 rgba(180,207,232,0.07), 0 16px 48px rgba(0,0,0,0.4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                      "linear-gradient(90deg, transparent, #e8962a, transparent)",
                    opacity: 0.7,
                  }}
                  aria-hidden="true"
                />
                {content && <ReportBody sections={content.body} />}
              </div>

              {/* Article footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                  padding: "0.75rem 0 0",
                  borderTop: "1px solid rgba(180,207,232,0.06)",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(180,207,232,0.22)",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  By {meta.author}
                </p>
                <Link
                  href="/tracker/methodology"
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(96,165,250,0.55)",
                    textDecoration: "none",
                  }}
                >
                  How we calculate this
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
