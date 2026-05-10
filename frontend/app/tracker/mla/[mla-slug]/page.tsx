import { notFound } from "next/navigation";
import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import {
  getMlaById,
  getPartyById,
  buildTimelineSeries,
  buildVoteBreakdown,
} from "../../_data";
import ContributionTimeline from "../../../components/tracker/ContributionTimeline";
import VoteBreakdown from "../../../components/tracker/VoteBreakdown";
import ChainPanel from "../../../components/ChainPanel";
import VerifiedBadge from "../../../components/VerifiedBadge";
import type { MlaPledge, VoteRecord, InterestRecord, DonationRecord } from "../../_types";

export async function generateStaticParams() {
  const { getMlas } = await import("../../_data");
  const { mlas } = getMlas();
  return mlas.map((m) => ({ "mla-slug": m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "mla-slug": string }>;
}) {
  const { "mla-slug": slug } = await params;
  const mla = getMlaById(slug);
  if (!mla) return { title: "MLA not found" };
  return {
    title: `${mla.name} — MLA Tracker`,
    description: mla.bio_short,
  };
}

const CARD: CSSProperties = {
  background: "rgba(11,20,38,0.82)",
  border: "1px solid rgba(180,207,232,0.11)",
  borderRadius: "14px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.45)",
  position: "relative",
  overflow: "hidden",
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
        borderRadius: "14px 14px 0 0",
        opacity: 0.7,
      }}
      aria-hidden="true"
    />
  );
}

const STATUS_META = {
  backed: { label: "Backed", color: "#22c55e" },
  partial: { label: "Partial", color: "#eab308" },
  mismatch: { label: "Mismatch", color: "#ef4444" },
  unknown: { label: "Unknown", color: "rgba(180,207,232,0.35)" },
} as const;

const VOTE_COLORS = {
  For: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22c55e" },
  Against: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#ef4444" },
  Abstain: {
    bg: "rgba(180,207,232,0.04)",
    border: "rgba(180,207,232,0.12)",
    text: "rgba(180,207,232,0.45)",
  },
  "Not Present": {
    bg: "rgba(180,207,232,0.04)",
    border: "rgba(180,207,232,0.12)",
    text: "rgba(180,207,232,0.3)",
  },
} as const;

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "rgba(180,207,232,0.3)",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "0.85rem",
      }}
    >
      {text}
    </p>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        ...CARD,
        padding: "1.3rem 1.2rem",
        textAlign: "center",
      }}
    >
      <TopStripe color={color} />
      <div
        style={{
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 900,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.63rem",
          color: "rgba(180,207,232,0.3)",
          marginTop: "0.35rem",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PledgeRow({ pledge }: { pledge: MlaPledge }) {
  const sm = STATUS_META[pledge.status];
  return (
    <div
      style={{
        ...CARD,
        padding: "0.9rem 1.1rem",
        marginBottom: "0.5rem",
      }}
    >
      <TopStripe color={sm.color} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: sm.color,
            boxShadow: `0 0 6px ${sm.color}80`,
            flexShrink: 0,
            marginTop: "0.4rem",
          }}
          aria-hidden="true"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.83rem",
                fontWeight: 600,
                color: "rgba(215,228,242,0.9)",
              }}
            >
              {pledge.title}
            </span>
            <span
              style={{
                fontSize: "0.58rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                background: "rgba(232,150,42,0.1)",
                color: "#e8962a",
                border: "1px solid rgba(232,150,42,0.22)",
                borderRadius: "20px",
                padding: "0.05rem 0.4rem",
              }}
            >
              {pledge.category}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.74rem",
              color: "rgba(180,207,232,0.48)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {pledge.evidence.value}
          </p>
          {pledge.evidence.source_urls[0] && (
            <a
              href={pledge.evidence.source_urls[0]}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.64rem",
                color: "#60a5fa",
                textDecoration: "none",
                marginTop: "0.25rem",
              }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Source
            </a>
          )}
        </div>
        <span
          style={{
            fontSize: "0.63rem",
            fontWeight: 700,
            color: sm.color,
            flexShrink: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {sm.label}
        </span>
      </div>
    </div>
  );
}

function VoteRow({ vote }: { vote: VoteRecord }) {
  const vc =
    vote.vote in VOTE_COLORS
      ? VOTE_COLORS[vote.vote as keyof typeof VOTE_COLORS]
      : VOTE_COLORS["Abstain"];
  const dateStr = new Date(vote.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.8rem",
        padding: "0.85rem 1rem",
        background: vc.bg,
        border: `1px solid ${vc.border}`,
        borderRadius: "10px",
        marginBottom: "0.45rem",
      }}
    >
      <span
        style={{
          fontSize: "0.58rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: vc.text,
          border: `1px solid ${vc.border}`,
          borderRadius: "20px",
          padding: "0.12rem 0.45rem",
          flexShrink: 0,
          marginTop: "0.1rem",
          minWidth: 48,
          textAlign: "center",
        }}
      >
        {vote.vote}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(215,228,242,0.88)",
            marginBottom: "0.18rem",
          }}
        >
          {vote.bill}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.65rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "0.66rem", color: "rgba(180,207,232,0.38)" }}
          >
            {dateStr}
          </span>
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              textTransform: "uppercase",
              background: "rgba(232,150,42,0.1)",
              color: "#e8962a",
              border: "1px solid rgba(232,150,42,0.22)",
              borderRadius: "20px",
              padding: "0.04rem 0.38rem",
            }}
          >
            {vote.policy_axis}
          </span>
        </div>
      </div>
      {vote.hansard_url && (
        <a
          href={vote.hansard_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.22rem",
            fontSize: "0.63rem",
            color: "#60a5fa",
            textDecoration: "none",
            flexShrink: 0,
            marginTop: "0.1rem",
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
          Hansard
        </a>
      )}
    </div>
  );
}

export default async function MlaTrackerPage({
  params,
}: {
  params: Promise<{ "mla-slug": string }>;
}) {
  const { "mla-slug": slug } = await params;
  const mla = getMlaById(slug);
  if (!mla) notFound();

  const party = getPartyById(mla.party_id);
  const color = party?.color ?? "#b4cfe8";
  const timeline = buildTimelineSeries(mla);
  const voteBreakdown = buildVoteBreakdown(mla);

  const initials = mla.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const backedCount = mla.pledges.filter((p) => p.status === "backed").length;
  const partialCount = mla.pledges.filter((p) => p.status === "partial").length;
  const mismatchCount = mla.pledges.filter((p) => p.status === "mismatch").length;

  return (
    <main>
      <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        {/* Breadcrumb */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
            fontSize: "0.72rem",
            flexWrap: "wrap",
          }}
          aria-label="Breadcrumb"
        >
          <Link href="/tracker" style={{ color: "rgba(180,207,232,0.4)", textDecoration: "none" }}>
            MLA Tracker
          </Link>
          <span style={{ color: "rgba(180,207,232,0.18)" }} aria-hidden="true">/</span>
          <Link
            href={`/tracker/party/${mla.party_id}`}
            style={{ color, textDecoration: "none", fontWeight: 700 }}
          >
            {party?.short_name ?? mla.party_id}
          </Link>
          <span style={{ color: "rgba(180,207,232,0.18)" }} aria-hidden="true">/</span>
          <span style={{ color: "#b4cfe8" }}>{mla.name}</span>
        </nav>

        {/* ── Hero ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {/* Identity */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.2rem",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: `${color}18`,
                  border: `3px solid ${color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  fontWeight: 900,
                  color,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {initials}
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                    fontWeight: 900,
                    color: "#b4cfe8",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    marginBottom: "0.3rem",
                    textShadow: "0 0 40px rgba(180,207,232,0.25)",
                  }}
                >
                  {mla.name}
                </h1>
                {mla.role && (
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color,
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {mla.role}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "0.9rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Link
                    href={`/tracker/party/${mla.party_id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.75rem",
                      color: "rgba(180,207,232,0.45)",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                        display: "inline-block",
                      }}
                      aria-hidden="true"
                    />
                    {party?.name ?? mla.party_id}
                  </Link>
                  <span
                    style={{ fontSize: "0.75rem", color: "rgba(180,207,232,0.35)" }}
                  >
                    {mla.constituency}
                  </span>
                </div>
              </div>
            </div>

            {/* Badge + score */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.75rem",
              }}
            >
              <VerifiedBadge politicianId={mla.id} />
              <div style={{ ...CARD, padding: "0.75rem 1.1rem", textAlign: "right" }}>
                <TopStripe color={color} />
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 900,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {mla.pledge_delivery_score.value}
                </div>
                <div
                  style={{
                    fontSize: "0.63rem",
                    color: "rgba(180,207,232,0.38)",
                    marginTop: "0.15rem",
                  }}
                >
                  delivery score
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bio ── */}
        {mla.bio_short && (
          <div style={{ ...CARD, padding: "1.3rem 1.5rem", marginBottom: "1.5rem" }}>
            <TopStripe color={color} />
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(215,228,242,0.7)",
                lineHeight: 1.78,
                margin: 0,
              }}
            >
              {mla.bio_short}
            </p>
          </div>
        )}

        {/* ── Stat row ── */}
        <div
          style={{
            display: "flex",
            gap: "0.9rem",
            flexWrap: "wrap",
            marginBottom: "2.5rem",
          }}
        >
          <StatCard
            value={`${mla.party_line_voting_pct.value}%`}
            label="Party-line voting"
            color={color}
          />
          <StatCard
            value={String(mla.chamber_contributions_total.value)}
            label="Chamber contributions"
            color="#e8962a"
          />
          <StatCard
            value={`${mla.committee_attendance_pct.value}%`}
            label="Committee attendance"
            color="#b4cfe8"
          />
        </div>

        {/* ── Charts ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "2.5rem" }}>
          <ContributionTimeline
            data={timeline}
            partyColor={color}
            mlaName={mla.name}
          />
          <VoteBreakdown
            data={voteBreakdown}
            partyColor={color}
            mlaName={mla.name}
            partyLineVotingPct={mla.party_line_voting_pct.value}
          />
        </div>

        {/* ── Pledge tracker ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <SectionLabel text="Pledge tracker" />
            <div style={{ display: "flex", gap: "0.8rem" }}>
              {[
                { n: backedCount, label: "backed", c: "#22c55e" },
                { n: partialCount, label: "partial", c: "#eab308" },
                { n: mismatchCount, label: "mismatch", c: "#ef4444" },
              ].map(({ n, label, c }) => (
                <span
                  key={label}
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: c,
                    background: `${c}12`,
                    border: `1px solid ${c}30`,
                    borderRadius: "20px",
                    padding: "0.15rem 0.55rem",
                  }}
                >
                  {n} {label}
                </span>
              ))}
            </div>
          </div>
          {mla.pledges.map((pledge) => (
            <PledgeRow key={pledge.id} pledge={pledge} />
          ))}
        </section>

        {/* ── Voting record ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel
            text={`Voting record (${mla.votes.length} tracked divisions)`}
          />
          {mla.votes.map((v) => (
            <VoteRow key={v.id} vote={v} />
          ))}
        </section>

        {/* ── Interests ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel text="Declared interests" />
          {mla.interests.length > 0 ? (
            <div style={{ ...CARD, overflow: "auto" }}>
              <TopStripe color={color} />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.76rem",
                }}
                aria-label="Declared interests"
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.07)" }}>
                    {["Type", "Entity", "Registered", "Value"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          padding: "0.85rem 1.1rem",
                          textAlign: "left",
                          color: "rgba(180,207,232,0.3)",
                          fontWeight: 600,
                          fontSize: "0.62rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mla.interests.map((item: InterestRecord, i: number) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom:
                          i < mla.interests.length - 1
                            ? "1px solid rgba(180,207,232,0.04)"
                            : "none",
                      }}
                    >
                      <td
                        style={{ padding: "0.75rem 1.1rem", color: "rgba(180,207,232,0.55)" }}
                      >
                        {item.type}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1.1rem",
                          color: "rgba(215,228,242,0.85)",
                          fontWeight: 600,
                        }}
                      >
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {item.entity}
                        </a>
                      </td>
                      <td
                        style={{ padding: "0.75rem 1.1rem", color: "rgba(180,207,232,0.38)" }}
                      >
                        {new Date(item.registered_date).toLocaleDateString("en-GB", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td
                        style={{ padding: "0.75rem 1.1rem", color: "rgba(180,207,232,0.5)" }}
                      >
                        {item.value ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              style={{ color: "rgba(180,207,232,0.28)", fontSize: "0.8rem" }}
            >
              No interests declared on the register.
            </p>
          )}
        </section>

        {/* ── Donations ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel text="Reported donations" />
          {mla.donations.length > 0 ? (
            <div style={{ ...CARD, overflow: "auto" }}>
              <TopStripe color={color} />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.76rem",
                }}
                aria-label="Reported donations"
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.07)" }}>
                    {["Donor", "Amount", "Date", "Type"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          padding: "0.85rem 1.1rem",
                          textAlign: "left",
                          color: "rgba(180,207,232,0.3)",
                          fontWeight: 600,
                          fontSize: "0.62rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mla.donations.map((d: DonationRecord, i: number) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom:
                          i < mla.donations.length - 1
                            ? "1px solid rgba(180,207,232,0.04)"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.75rem 1.1rem",
                          color: "rgba(215,228,242,0.85)",
                          fontWeight: 600,
                        }}
                      >
                        <a
                          href={d.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {d.donor}
                        </a>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1.1rem",
                          color: "#22c55e",
                          fontWeight: 700,
                        }}
                      >
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          maximumFractionDigits: 0,
                        }).format(d.amount)}
                      </td>
                      <td
                        style={{ padding: "0.75rem 1.1rem", color: "rgba(180,207,232,0.38)" }}
                      >
                        {new Date(d.date).toLocaleDateString("en-GB", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td
                        style={{ padding: "0.75rem 1.1rem", color: "rgba(180,207,232,0.5)" }}
                      >
                        {d.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              style={{ color: "rgba(180,207,232,0.28)", fontSize: "0.8rem" }}
            >
              No donations on record.
            </p>
          )}
          <p
            style={{
              fontSize: "0.63rem",
              color: "rgba(180,207,232,0.18)",
              fontStyle: "italic",
              marginTop: "0.6rem",
            }}
          >
            Sourced from the Electoral Commission NI donation register. Some entries
            use illustrative data for the prototype phase.
          </p>
        </section>

        {/* ── Blockchain verification ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel text="Blockchain verification" />
          <ChainPanel politicianId={mla.id} />
        </section>

        {/* ── Data provenance ── */}
        <section>
          <SectionLabel text="Data provenance" />
          <div style={{ ...CARD, padding: "1.2rem 1.5rem" }}>
            <TopStripe color="rgba(180,207,232,0.25)" />
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.4rem 1.2rem",
                fontSize: "0.72rem",
                margin: 0,
              }}
            >
              {[
                {
                  term: "Delivery score",
                  def: mla.pledge_delivery_score.method,
                  src: mla.pledge_delivery_score.source_urls[0],
                },
                {
                  term: "Party-line voting",
                  def: mla.party_line_voting_pct.method,
                  src: mla.party_line_voting_pct.source_urls[0],
                },
                {
                  term: "Contributions",
                  def: mla.chamber_contributions_total.method,
                  src: mla.chamber_contributions_total.source_urls[0],
                },
                {
                  term: "Attendance",
                  def: mla.committee_attendance_pct.method,
                  src: mla.committee_attendance_pct.source_urls[0],
                },
              ].map(({ term, def, src }) => (
                <Fragment key={term}>
                  <dt
                    style={{
                      color: "rgba(180,207,232,0.4)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {term}
                  </dt>
                  <dd
                    style={{
                      color: "rgba(180,207,232,0.28)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {def}{" "}
                    {src && (
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#60a5fa" }}
                      >
                        ↗
                      </a>
                    )}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
