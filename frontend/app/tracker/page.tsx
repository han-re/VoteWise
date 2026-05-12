import Link from "next/link";
import type { CSSProperties } from "react";
import {
  buildSwarmNodes,
  getMlas,
  getParties,
  getPageJson,
  getRecentSessions,
} from "./_data";
import { SessionCard } from "../components/tracker/SessionCard";
import { BeeSwarmChartClient } from "../components/tracker/BeeSwarmChartClient";
import type { Party, SessionCardMeta } from "./_types";

export default function TrackerPage() {
  const nodes = buildSwarmNodes();
  const { mlas } = getMlas();
  const { parties } = getParties();
  const pageData = getPageJson();
  const recentSessions = getRecentSessions(9);

  const hasSessions = recentSessions.length > 0;
  const featured = pageData.featured;

  return (
    <main>
      {/* ── Masthead ── */}
      <section
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "4rem 1.5rem 2.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            borderBottom: "2px solid rgba(180,207,232,0.12)",
            paddingBottom: "0.8rem",
            marginBottom: "0.5rem",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-source-serif, Georgia, serif)",
              fontSize: "clamp(2rem, 4.5vw, 3rem)",
              fontWeight: 900,
              color: "#b4cfe8",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              textShadow: "0 0 60px rgba(180,207,232,0.2)",
            }}
          >
            Votewise Pro
          </h1>
          <p
            style={{
              fontSize: "0.65rem",
              color: "rgba(180,207,232,0.28)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Stormont accountability
          </p>
        </div>
        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(180,207,232,0.38)",
            letterSpacing: "0.04em",
          }}
        >
          {pageData.last_updated
            ? `Updated ${new Date(pageData.last_updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
            : "Every pledge. Every vote. Every declared interest."}
        </p>
      </section>

      {/* ── Sessions section ── */}
      {hasSessions ? (
        <section
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 1.5rem 4rem",
          }}
        >
          <SectionLabel text="This week in Stormont" />

          {featured && (
            <div style={{ marginBottom: "1.5rem" }}>
              <SessionCard
                session={{
                  slug: featured.session_slug,
                  date: pageData.last_updated,
                  headline: featured.summary,
                  session_type: featured.kicker.toLowerCase() as SessionCardMeta["session_type"],
                  key_topics: [],
                }}
                featured
              />
            </div>
          )}

          {recentSessions.length > 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {recentSessions.map((session) => (
                <SessionCard key={session.slug} session={session} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ── Empty state — shown until first PDF is processed ── */
        <section
          style={{
            maxWidth: "52rem",
            margin: "0 auto",
            padding: "0 1.5rem 4rem",
          }}
        >
          <div
            style={{
              background: "rgba(11,20,38,0.7)",
              border: "1px solid rgba(180,207,232,0.09)",
              borderRadius: "16px",
              padding: "2.5rem 2.8rem",
              backdropFilter: "blur(12px)",
            }}
          >
            <p
              style={{
                fontSize: "0.6rem",
                color: "#e8962a",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "0.8rem",
              }}
            >
              No sessions yet
            </p>
            <h2
              style={{
                fontFamily: "var(--font-source-serif, Georgia, serif)",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#b4cfe8",
                lineHeight: 1.3,
                marginBottom: "0.8rem",
              }}
            >
              Drop a Hansard PDF to get started
            </h2>
            <p
              style={{
                fontSize: "0.82rem",
                color: "rgba(180,207,232,0.45)",
                lineHeight: 1.7,
                marginBottom: "1.2rem",
              }}
            >
              Run the pipeline to process a session transcript. The summary,
              speaker breakdown, and chatbot will appear here automatically.
            </p>
            <code
              style={{
                display: "block",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(180,207,232,0.08)",
                borderRadius: "8px",
                padding: "0.8rem 1rem",
                fontSize: "0.72rem",
                color: "rgba(180,207,232,0.6)",
                fontFamily: "monospace",
              }}
            >
              python -m backend_tracker.scripts.process_session raw-pdfs/session.pdf YYYY-MM-DD-topic-slug
            </code>
          </div>
        </section>
      )}

      {/* ── Bee Swarm — pledge delivery overview ── */}
      <section
        style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 5rem" }}
      >
        <SectionLabel text="Pledge delivery" />
        <Explainer>
          Each dot is an MLA tracked by VoteWise. The further right, the more of
          their 2022 election promises have been kept. Hover a dot to see who it
          is — click to see their full record.
        </Explainer>
        <BeeSwarmChartClient nodes={nodes} height={200} />
        {/* Score axis labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.3rem 0 0",
            fontSize: "0.6rem",
            color: "rgba(180,207,232,0.2)",
          }}
          aria-hidden="true"
        >
          <span>No pledges kept</span>
          <span>All pledges kept</span>
        </div>
      </section>

      {/* ── Party grid ── */}
      <section
        style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 5rem" }}
      >
        <SectionLabel text="Browse by party" />
        <Explainer>
          The score out of 100 shows how many of each party&apos;s election promises
          are being kept. Green means the promise has been kept, amber means
          partly delivered, red means broken or contradicted. Click any party to
          see their full promise list with evidence.
        </Explainer>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
        >
          {parties.map((party, i) => (
            <PartyCard key={party.id} party={party} delay={i * 0.07} />
          ))}
        </div>
      </section>

      {/* ── MLA grid ── */}
      <section
        style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 5rem" }}
      >
        <SectionLabel text="Browse by MLA" />
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          role="list"
        >
          {mlas.map((mla, i) => {
            const party = parties.find((p) => p.id === mla.party_id);
            return (
              <Link
                key={mla.id}
                href={`/tracker/mla/${mla.id}`}
                className="mandate-question-enter"
                style={
                  {
                    animationDelay: `${i * 0.06}s`,
                    background: "rgba(11,20,38,0.82)",
                    border: "1px solid rgba(180,207,232,0.11)",
                    borderRadius: "12px",
                    padding: "1.1rem 0.9rem 0.9rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    textDecoration: "none",
                    color: "inherit",
                    textAlign: "center",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow:
                      "inset 0 1px 0 rgba(180,207,232,0.07), 0 8px 24px rgba(0,0,0,0.4)",
                    position: "relative",
                    overflow: "hidden",
                    transition:
                      "border-color 0.25s, box-shadow 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  } as CSSProperties
                }
                role="listitem"
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, transparent, ${party?.color ?? "#b4cfe8"}, transparent)`,
                    borderRadius: "12px 12px 0 0",
                    opacity: 0.7,
                  }}
                  aria-hidden="true"
                />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `${party?.color ?? "#b4cfe8"}18`,
                    border: `2px solid ${party?.color ?? "#b4cfe8"}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: party?.color ?? "#b4cfe8",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                  }}
                  aria-hidden="true"
                >
                  {mla.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "rgba(215,228,242,0.9)",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {mla.name}
                </p>
                <p
                  style={{
                    fontSize: "0.63rem",
                    color: "rgba(180,207,232,0.35)",
                    margin: 0,
                  }}
                >
                  {party?.short_name}
                </p>
                <div
                  style={{
                    marginTop: "0.4rem",
                    fontSize: "1.1rem",
                    fontWeight: 900,
                    color: party?.color ?? "#e8962a",
                    lineHeight: 1,
                  }}
                >
                  {mla.pledge_delivery_score.value}
                  <span
                    style={{
                      fontSize: "0.55rem",
                      color: "rgba(180,207,232,0.25)",
                      marginLeft: "0.2rem",
                    }}
                  >
                    / 100
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function Explainer({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "0.8rem",
        color: "rgba(180,207,232,0.42)",
        lineHeight: 1.7,
        marginBottom: "1.2rem",
        maxWidth: "52rem",
      }}
    >
      {children}
    </p>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        color: "rgba(180,207,232,0.28)",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        marginBottom: "0.9rem",
        borderBottom: "1px solid rgba(180,207,232,0.06)",
        paddingBottom: "0.5rem",
      }}
    >
      {text}
    </p>
  );
}

function PartyCard({ party, delay }: { party: Party; delay: number }) {
  const { backed, partial, mismatch } = party.delivery_summary;
  const total = backed.value + partial.value + mismatch.value;

  return (
    <Link
      href={`/tracker/party/${party.id}`}
      className="mandate-question-enter"
      style={
        {
          animationDelay: `${delay}s`,
          display: "block",
          background: "rgba(11,20,38,0.82)",
          border: "1px solid rgba(180,207,232,0.11)",
          borderRadius: "14px",
          padding: "1.6rem 1.6rem 1.3rem",
          textDecoration: "none",
          color: "inherit",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "inset 0 1px 0 rgba(180,207,232,0.07), 0 12px 36px rgba(0,0,0,0.4)",
          position: "relative",
          overflow: "hidden",
          transition:
            "border-color 0.25s, box-shadow 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        } as CSSProperties
      }
      role="listitem"
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${party.color}, transparent)`,
          borderRadius: "14px 14px 0 0",
          opacity: 0.7,
        }}
        aria-hidden="true"
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#b4cfe8",
              margin: "0 0 0.2rem",
              letterSpacing: "-0.01em",
            }}
          >
            {party.short_name}
          </p>
          <p style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.35)", margin: 0 }}>
            {party.leader} · {party.seats_2022} seats
          </p>
        </div>
        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 900,
            color: party.color,
            lineHeight: 1,
            textShadow: `0 0 24px ${party.color}55`,
          }}
        >
          {party.overall_score.value}
        </div>
      </div>

      <div
        style={{ marginBottom: "0.75rem" }}
        role="img"
        aria-label={`${backed.value} pledges kept, ${partial.value} partial, ${mismatch.value} missed`}
      >
        <div
          style={{
            height: "6px",
            borderRadius: "3px",
            background: "rgba(180,207,232,0.06)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {[
            { val: backed.value, color: "#22c55e" },
            { val: partial.value, color: "#eab308" },
            { val: mismatch.value, color: "#ef4444" },
          ].map(({ val, color }) => (
            <div
              key={color}
              style={{
                height: "100%",
                width: `${total > 0 ? (val / total) * 100 : 0}%`,
                background: color,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {[
          { n: backed.value, label: "kept", c: "#22c55e" },
          { n: partial.value, label: "partial", c: "#eab308" },
          { n: mismatch.value, label: "missed", c: "#ef4444" },
        ].map(({ n, label, c }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: c, lineHeight: 1 }}>{n}</div>
            <div
              style={{
                fontSize: "0.6rem",
                color: "rgba(180,207,232,0.28)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}
