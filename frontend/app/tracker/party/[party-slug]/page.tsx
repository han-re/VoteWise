import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getParties, getPartyById, getMlasByParty } from "../../_data";
import type { PartyPledge, Mla, Party } from "../../_types";

export function generateStaticParams() {
  const { parties } = getParties();
  return parties.map((p) => ({ "party-slug": p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "party-slug": string }>;
}): Promise<Metadata> {
  const { "party-slug": slug } = await params;
  const party = getPartyById(slug);
  if (!party) return { title: "Party not found — MLA Tracker" };
  return {
    title: `${party.short_name} — MLA Tracker`,
    description: `${party.name} pledge delivery scorecard. ${party.delivery_summary.backed.value} kept, ${party.delivery_summary.partial.value} partial, ${party.delivery_summary.mismatch.value} mismatch. ${party.ideology}.`,
  };
}

const STATUS_META: Record<
  PartyPledge["status"],
  { label: string; color: string; order: number }
> = {
  backed:   { label: "Backed",   color: "#22c55e", order: 0 },
  partial:  { label: "Partial",  color: "#eab308", order: 1 },
  mismatch: { label: "Mismatch", color: "#ef4444", order: 2 },
  unknown:  { label: "Unknown",  color: "rgba(180,207,232,0.35)", order: 3 },
};

function TopStripe({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        borderRadius: "inherit",
        opacity: 0.7,
      }}
      aria-hidden="true"
    />
  );
}

function StatusBadge({ status }: { status: PartyPledge["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.15rem 0.55rem",
        borderRadius: "99px",
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: meta.color,
        background: `${meta.color}18`,
        border: `1px solid ${meta.color}30`,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: meta.color,
          display: "inline-block",
        }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "0.15rem 0.5rem",
        borderRadius: "6px",
        fontSize: "0.6rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "rgba(180,207,232,0.5)",
        background: "rgba(180,207,232,0.07)",
        border: "1px solid rgba(180,207,232,0.1)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function PledgeRow({ pledge }: { pledge: PartyPledge }) {
  return (
    <div
      style={{
        padding: "1rem 1.1rem",
        borderBottom: "1px solid rgba(180,207,232,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.65rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(215,228,242,0.85)",
            flex: 1,
            minWidth: 0,
            lineHeight: 1.4,
          }}
        >
          {pledge.title}
        </span>
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <CategoryBadge label={pledge.category} />
          <StatusBadge status={pledge.status} />
        </div>
      </div>
      <p
        style={{
          fontSize: "0.76rem",
          color: "rgba(180,207,232,0.45)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {pledge.evidence}
      </p>
      {pledge.source_urls.length > 0 && (
        <a
          href={pledge.source_urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.65rem",
            color: "#60a5fa",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            width: "fit-content",
          }}
        >
          Source
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  );
}

function MlaCard({ mla, party }: { mla: Mla; party: Party }) {
  const initials = mla.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/tracker/mla/${mla.id}`}
      style={
        {
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          background: "rgba(11,20,38,0.6)",
          border: "1px solid rgba(180,207,232,0.1)",
          borderRadius: "12px",
          padding: "1rem 1.1rem",
          textDecoration: "none",
          color: "inherit",
          position: "relative",
          overflow: "hidden",
          transition:
            "border-color 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        } as CSSProperties
      }
    >
      <TopStripe color={party.color} />
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: `${party.color}18`,
          border: `2px solid ${party.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: party.color,
          fontSize: "0.88rem",
          fontWeight: 900,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.84rem",
            fontWeight: 700,
            color: "rgba(215,228,242,0.9)",
            margin: "0 0 0.15rem",
            lineHeight: 1.2,
          }}
        >
          {mla.name}
        </p>
        <p
          style={{
            fontSize: "0.68rem",
            color: "rgba(180,207,232,0.38)",
            margin: 0,
          }}
        >
          {mla.constituency}
          {mla.role ? ` · ${mla.role}` : ""}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "1.2rem",
            fontWeight: 900,
            color: party.color,
            lineHeight: 1,
          }}
        >
          {mla.pledge_delivery_score.value}
        </div>
        <div
          style={{
            fontSize: "0.55rem",
            color: "rgba(180,207,232,0.25)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          / 100
        </div>
      </div>
    </Link>
  );
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ "party-slug": string }>;
}) {
  const { "party-slug": slug } = await params;
  const party = getPartyById(slug);

  if (!party) {
    return (
      <main
        style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1.5rem" }}
      >
        <p style={{ color: "rgba(180,207,232,0.5)" }}>Party not found.</p>
        <Link
          href="/tracker"
          style={{ color: "#60a5fa", fontSize: "0.82rem" }}
        >
          Back to MLA Tracker
        </Link>
      </main>
    );
  }

  const mlas = getMlasByParty(party.id);

  const { backed, partial, mismatch, unknown } = party.delivery_summary;
  const totalPledges = backed.value + partial.value + mismatch.value + unknown.value;

  // Group pledges by status in display order
  const grouped = Object.entries(STATUS_META)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([status]) => ({
      status: status as PartyPledge["status"],
      pledges: party.pledges.filter((p) => p.status === status),
    }))
    .filter(({ pledges }) => pledges.length > 0);

  const summaryStats = [
    { value: backed.value,   label: "Backed",   color: "#22c55e" },
    { value: partial.value,  label: "Partial",  color: "#eab308" },
    { value: mismatch.value, label: "Mismatch", color: "#ef4444" },
    { value: unknown.value,  label: "Unknown",  color: "rgba(180,207,232,0.35)" },
  ];

  return (
    <main
      style={{ maxWidth: "60rem", margin: "0 auto", padding: "4rem 1.5rem 5rem" }}
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
        <span style={{ color: "#b4cfe8" }}>{party.short_name}</span>
      </nav>

      {/* ── Party hero ── */}
      <div
        style={{
          background: "rgba(11,20,38,0.85)",
          border: "1px solid rgba(180,207,232,0.13)",
          borderRadius: "16px",
          padding: "2.2rem 2rem 2rem",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.5)",
          position: "relative",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <TopStripe color={party.color} />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                color: "rgba(180,207,232,0.38)",
                fontSize: "0.68rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Party scorecard
            </p>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                fontWeight: 900,
                color: "#b4cfe8",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "0.3rem",
              }}
            >
              {party.name}
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "rgba(180,207,232,0.4)",
                margin: "0 0 0.15rem",
              }}
            >
              {party.leader} · {party.seats_2022} seats (2022)
            </p>
            <p
              style={{
                fontSize: "0.76rem",
                color: "rgba(180,207,232,0.3)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              {party.ideology}
            </p>
          </div>

          {/* Score */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "3.2rem",
                fontWeight: 900,
                color: party.color,
                lineHeight: 1,
                textShadow: `0 0 32px ${party.color}55`,
              }}
              aria-label={`Overall delivery score: ${party.overall_score.value} out of 100`}
            >
              {party.overall_score.value}
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "rgba(180,207,232,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: "0.15rem",
              }}
            >
              delivery score
            </div>
          </div>
        </div>

        {/* Delivery bar */}
        <div
          style={{ marginTop: "1.5rem" }}
          role="img"
          aria-label={`Pledge delivery: ${backed.value} backed, ${partial.value} partial, ${mismatch.value} mismatch, ${unknown.value} unknown`}
        >
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              background: "rgba(180,207,232,0.06)",
              overflow: "hidden",
              display: "flex",
              marginBottom: "0.85rem",
            }}
          >
            {summaryStats.filter((s) => s.value > 0).map(({ value, color }) => (
              <div
                key={color}
                style={{
                  height: "100%",
                  width: `${(value / totalPledges) * 100}%`,
                  background: color,
                  transition: "width 0.6s ease",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {summaryStats.map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${color}44`,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "rgba(180,207,232,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "0.2rem",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pledge tracker ── */}
      <section aria-labelledby="pledge-tracker-heading" style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "rgba(180,207,232,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: "1rem",
          }}
        >
          Pledge tracker
        </p>
        <h2
          id="pledge-tracker-heading"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            fontWeight: 800,
            color: "#b4cfe8",
            letterSpacing: "-0.02em",
            marginBottom: "1rem",
          }}
        >
          All {totalPledges} pledges
        </h2>

        <div
          style={{
            background: "rgba(11,20,38,0.82)",
            border: "1px solid rgba(180,207,232,0.11)",
            borderRadius: "14px",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow:
              "inset 0 1px 0 rgba(180,207,232,0.07), 0 12px 36px rgba(0,0,0,0.35)",
          }}
        >
          {grouped.map(({ status, pledges }, groupIdx) => {
            const meta = STATUS_META[status];
            return (
              <div key={status}>
                {/* Group header */}
                <div
                  style={{
                    padding: "0.7rem 1.1rem",
                    background: `${meta.color}0a`,
                    borderBottom: "1px solid rgba(180,207,232,0.05)",
                    borderTop:
                      groupIdx > 0
                        ? "1px solid rgba(180,207,232,0.07)"
                        : undefined,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: meta.color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: meta.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "rgba(180,207,232,0.25)",
                      marginLeft: "auto",
                    }}
                  >
                    {pledges.length} pledge{pledges.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Pledges */}
                {pledges.map((pledge, i) => (
                  <div
                    key={pledge.id}
                    style={{
                      borderBottom:
                        i < pledges.length - 1
                          ? "1px solid rgba(180,207,232,0.04)"
                          : undefined,
                    }}
                  >
                    <PledgeRow pledge={pledge} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.66rem",
            color: "rgba(180,207,232,0.25)",
            fontStyle: "italic",
          }}
        >
          Scoring: Backed = 100 pts, Partial = 50 pts, Mismatch = 0 pts, Unknown = 25 pts.{" "}
          <Link
            href="/tracker/methodology"
            style={{ color: "rgba(96,165,250,0.7)", textDecoration: "none" }}
          >
            How is this calculated?
          </Link>
        </p>
      </section>

      {/* ── MLAs ── */}
      {mlas.length > 0 && (
        <section aria-labelledby="mlas-heading">
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "rgba(180,207,232,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: "1rem",
            }}
          >
            Representatives
          </p>
          <h2
            id="mlas-heading"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              fontWeight: 800,
              color: "#b4cfe8",
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
            }}
          >
            {party.short_name} MLAs tracked
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.85rem",
            }}
            role="list"
          >
            {mlas.map((mla) => (
              <div key={mla.id} role="listitem">
                <MlaCard mla={mla} party={party} />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
