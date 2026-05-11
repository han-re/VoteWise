import Link from "next/link";
import type { Metadata } from "next";
import { getReports, getReport } from "../../_data";
import type { ReportSection, CalloutType } from "../../_types";

export function generateStaticParams() {
  const { reports } = getReports();
  return reports.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return { title: "Report not found — MLA Tracker" };
  return {
    title: `${report.title} — MLA Tracker`,
    description: report.subtitle,
  };
}

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
    label: "Caveat",
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
        // paragraph
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

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getReport(slug);

  if (!report) {
    return (
      <main
        style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1.5rem" }}
      >
        <p style={{ color: "rgba(180,207,232,0.5)" }}>Report not found.</p>
        <Link
          href="/tracker/reports"
          style={{ color: "#60a5fa", fontSize: "0.82rem" }}
        >
          Back to analysis
        </Link>
      </main>
    );
  }

  const publishedDate = new Date(report.published).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          flexWrap: "wrap",
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
        <Link
          href="/tracker/reports"
          style={{ color: "rgba(180,207,232,0.4)", textDecoration: "none" }}
        >
          Analysis
        </Link>
        <span style={{ color: "rgba(180,207,232,0.18)" }} aria-hidden="true">
          /
        </span>
        <span
          style={{
            color: "#b4cfe8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "20rem",
          }}
        >
          {report.title}
        </span>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            color: "#e8962a",
            fontSize: "0.63rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "0.9rem",
          }}
        >
          Report · {publishedDate}
        </p>

        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            fontWeight: 900,
            color: "#b4cfe8",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "0.65rem",
            textShadow: "0 0 60px rgba(180,207,232,0.2)",
          }}
        >
          {report.title}
        </h1>

        <div
          style={{
            width: "48px",
            height: "2px",
            margin: "0 0 1rem",
            background:
              "linear-gradient(90deg, transparent, #e8962a, transparent)",
            borderRadius: "2px",
          }}
          aria-hidden="true"
        />

        <p
          style={{
            fontSize: "0.9rem",
            color: "rgba(180,207,232,0.5)",
            lineHeight: 1.65,
            marginBottom: "1.2rem",
          }}
        >
          {report.subtitle}
        </p>

        {report.topics.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
          >
            {report.topics.map((t) => (
              <TopicTag key={t} label={t} />
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <article
        aria-label={report.title}
        style={{
          background: "rgba(11,20,38,0.82)",
          border: "1px solid rgba(180,207,232,0.11)",
          borderRadius: "16px",
          padding: "2rem 2rem 2.2rem",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "inset 0 1px 0 rgba(180,207,232,0.07), 0 16px 48px rgba(0,0,0,0.4)",
          marginBottom: "2rem",
        }}
      >
        <ReportBody sections={report.body} />
      </article>

      {/* Footer meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "1rem 0 0",
          borderTop: "1px solid rgba(180,207,232,0.07)",
        }}
      >
        <p
          style={{
            fontSize: "0.68rem",
            color: "rgba(180,207,232,0.25)",
            margin: 0,
          }}
        >
          By {report.author} · Published {publishedDate}
        </p>
        <Link
          href="/tracker/methodology"
          style={{
            fontSize: "0.68rem",
            color: "rgba(96,165,250,0.6)",
            textDecoration: "none",
          }}
        >
          Our methodology
        </Link>
      </div>

      {/* Data hash */}
      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "0.6rem",
          color: "rgba(180,207,232,0.15)",
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}
      >
        Data hash: {report.data_hash}
      </p>
    </main>
  );
}
