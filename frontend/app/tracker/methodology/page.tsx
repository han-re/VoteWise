import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — MLA Tracker",
  description:
    "How MLA Tracker calculates pledge delivery scores, verifies voting records, and anchors data on the Solana blockchain.",
};

const SECTION_STYLE = {
  marginBottom: "3rem",
} as const;

const H2_STYLE = {
  fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
  fontWeight: 800,
  color: "#b4cfe8",
  letterSpacing: "-0.02em",
  marginBottom: "0.75rem",
} as const;

const P_STYLE = {
  fontSize: "0.84rem",
  color: "rgba(180,207,232,0.55)",
  lineHeight: 1.8,
  marginBottom: "0.85rem",
} as const;

function Divider({ color }: { color: string }) {
  return (
    <div
      style={{
        width: "40px",
        height: "2px",
        margin: "0 0 1rem",
        background: `linear-gradient(90deg, ${color}, transparent)`,
        borderRadius: "2px",
      }}
      aria-hidden="true"
    />
  );
}

function StatusPill({
  label,
  color,
  score,
}: {
  label: string;
  color: string;
  score: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        padding: "0.7rem 1rem",
        background: `${color}0a`,
        border: `1px solid ${color}22`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "8px",
        marginBottom: "0.5rem",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <div style={{ flex: 1 }}>
        <span
          style={{ fontSize: "0.82rem", fontWeight: 700, color: color }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "rgba(180,207,232,0.4)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(11,20,38,0.82)",
        border: "1px solid rgba(180,207,232,0.11)",
        borderRadius: "14px",
        padding: "1.8rem 2rem",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "inset 0 1px 0 rgba(180,207,232,0.07), 0 16px 48px rgba(0,0,0,0.4)",
        marginBottom: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <main
      style={{ maxWidth: "52rem", margin: "0 auto", padding: "4rem 1.5rem 4rem" }}
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
        <Link href="/tracker" style={{ color: "rgba(180,207,232,0.4)", textDecoration: "none" }}>
          MLA Tracker
        </Link>
        <span style={{ color: "rgba(180,207,232,0.18)" }} aria-hidden="true">/</span>
        <span style={{ color: "#b4cfe8" }}>Methodology</span>
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
        Transparency
      </p>
      <h1
        style={{
          fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
          fontWeight: 900,
          color: "#b4cfe8",
          letterSpacing: "-0.03em",
          textShadow: "0 0 60px rgba(180,207,232,0.25)",
          marginBottom: "0.6rem",
          lineHeight: 1.1,
        }}
      >
        Our methodology
      </h1>
      <div
        style={{
          width: "48px",
          height: "2px",
          margin: "0 0 1.5rem",
          background: "linear-gradient(90deg, transparent, #e8962a, transparent)",
          borderRadius: "2px",
        }}
        aria-hidden="true"
      />
      <p style={{ ...P_STYLE, fontSize: "0.9rem", marginBottom: "3rem" }}>
        MLA Tracker applies three tests to each Assembly Member: Voice (what they
        say in the chamber), Vote (how they vote in divisions), and Interest (what
        they have declared). Every claim is backed by a source link. Every score
        is reproducible from the raw data. Every calculation is described below.
      </p>

      {/* Section 1: The three tests */}
      <section style={SECTION_STYLE} aria-labelledby="three-tests">
        <Card>
          <h2 id="three-tests" style={H2_STYLE}>The three tests</h2>
          <Divider color="#e8962a" />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                n: "01",
                title: "Voice",
                desc: "We count and categorise every contribution a member makes in the chamber — debates, questions, statements, and committee appearances — and match them against the topics in their manifesto pledges. An MLA who never speaks about housing when they pledged housing reform is flagged.",
                color: "#b4cfe8",
              },
              {
                n: "02",
                title: "Vote",
                desc: "We extract division records from the Official Report and record every For, Against, Abstain, and Not Present against the relevant policy category. We then compare the MLA's vote to their party's stated position. Deviations from the party whip are noted individually.",
                color: "#e8962a",
              },
              {
                n: "03",
                title: "Interest",
                desc: "We extract every entry from the Register of Members' Interests and cross-reference it against the MLA's vote and debate record. We flag where a declared financial interest could create a conflict with a vote or public statement. We do not make accusations — we surface correlations and let the reader judge.",
                color: "#22c55e",
              },
            ].map(({ n, title, desc, color }) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  gap: "1.2rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    color: `${color}33`,
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                    lineHeight: 1,
                    marginTop: "0.05rem",
                  }}
                  aria-hidden="true"
                >
                  {n}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color,
                      marginBottom: "0.35rem",
                    }}
                  >
                    {title}
                  </h3>
                  <p style={{ ...P_STYLE, marginBottom: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Section 2: Pledge scoring */}
      <section style={SECTION_STYLE} aria-labelledby="pledge-scoring">
        <h2 id="pledge-scoring" style={H2_STYLE}>How pledge delivery is scored</h2>
        <Divider color="#e8962a" />

        <p style={P_STYLE}>
          Each party&apos;s 2022 Assembly election manifesto was reviewed and divided
          into individual, testable pledges. We exclude commitments that are
          explicitly dependent on Westminster action unless there is a corresponding
          Stormont motion or lobbying record to assess. Each pledge is assigned one
          of four statuses:
        </p>

        <StatusPill label="Backed — legislation passed or policy fully enacted" color="#22c55e" score="100 points" />
        <StatusPill label="Partial — progress made but pledge not yet fully delivered" color="#eab308" score="50 points" />
        <StatusPill label="Mismatch — voted against or directly contradicted by events" color="#ef4444" score="0 points" />
        <StatusPill label="Unknown — insufficient public record to assess" color="rgba(180,207,232,0.35)" score="25 points" />

        <p style={{ ...P_STYLE, marginTop: "1rem" }}>
          The overall delivery score is the average of all pledge scores. The
          MLA-level score is a weighted blend: 60% their individual pledge record,
          40% their party&apos;s platform score. This reflects the reality that an
          individual MLA cannot unilaterally deliver an Executive programme, but is
          accountable for how they vote when a relevant bill comes before the
          Assembly.
        </p>

        <p style={P_STYLE}>
          <strong style={{ color: "rgba(180,207,232,0.7)" }}>
            The Stormont boycott adjustment:
          </strong>{" "}
          The DUP&apos;s 22-month boycott (February 2022 to January 2024) materially
          prevented Executive function. We do not artificially raise DUP scores to
          adjust for this — but we note the boycott on their party page and in
          individual score explanations. The raw score reflects what actually
          happened during this mandate.
        </p>
      </section>

      {/* Section 3: Data sources */}
      <section style={SECTION_STYLE} aria-labelledby="data-sources">
        <h2 id="data-sources" style={H2_STYLE}>Data sources</h2>
        <Divider color="#b4cfe8" />
        <Card>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.78rem",
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "1px solid rgba(180,207,232,0.07)" }}
              >
                {["Source", "What we use it for", "Refresh cadence"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    style={{
                      padding: "0.6rem 0.8rem",
                      textAlign: "left",
                      color: "rgba(180,207,232,0.3)",
                      fontWeight: 600,
                      fontSize: "0.63rem",
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
              {[
                {
                  src: "Stormont Official Report (Hansard)",
                  use: "Votes, contributions, debates",
                  refresh: "Weekly",
                  url: "http://aims.niassembly.gov.uk/officialreport/",
                },
                {
                  src: "Register of Members&apos; Interests",
                  use: "Declared interests",
                  refresh: "Monthly",
                  url: "https://www.niassembly.gov.uk/your-mlas/register-of-interests/",
                },
                {
                  src: "Electoral Commission NI",
                  use: "Reported donations",
                  refresh: "Quarterly",
                  url: "https://search.electoralcommission.org.uk/",
                },
                {
                  src: "Stormont Committee minutes",
                  use: "Committee attendance",
                  refresh: "Monthly",
                  url: "https://www.niassembly.gov.uk/assembly-business/committees/",
                },
                {
                  src: "Legislation.gov.uk",
                  use: "Bill status and Royal Assent dates",
                  refresh: "As enacted",
                  url: "https://www.legislation.gov.uk/",
                },
              ].map((row, i, arr) => (
                <tr
                  key={row.src}
                  style={{
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid rgba(180,207,232,0.04)"
                        : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "0.65rem 0.8rem",
                      color: "rgba(215,228,242,0.8)",
                      fontWeight: 600,
                    }}
                  >
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", textDecoration: "none" }}
                    >
                      {row.src}
                    </a>
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.8rem",
                      color: "rgba(180,207,232,0.45)",
                    }}
                  >
                    {row.use}
                  </td>
                  <td
                    style={{
                      padding: "0.65rem 0.8rem",
                      color: "rgba(180,207,232,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.refresh}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Section 4: Blockchain anchoring */}
      <section style={SECTION_STYLE} aria-labelledby="blockchain">
        <h2 id="blockchain" style={H2_STYLE}>Blockchain anchoring</h2>
        <Divider color="#22c55e" />
        <p style={P_STYLE}>
          Every version of every MLA&apos;s profile is hashed using SHA-256 and the
          fingerprint is written to the Solana blockchain (devnet) as an
          immutable memo transaction. This means that if data were ever quietly
          altered after publication, the hash would no longer match the on-chain
          record — and the discrepancy would be visible to anyone who checks.
        </p>
        <p style={P_STYLE}>
          The VerifiedBadge shown on each MLA profile links directly to the Solana
          Explorer transaction. You can verify data integrity yourself by clicking
          &quot;Verify Now&quot; on any MLA&apos;s verification tab: the system fetches the
          live profile, computes the hash in your browser using the Web Crypto API,
          and compares it to the on-chain record.
        </p>
      </section>

      {/* Section 5: Limitations */}
      <section style={SECTION_STYLE} aria-labelledby="limitations">
        <h2 id="limitations" style={H2_STYLE}>Limitations</h2>
        <Divider color="rgba(180,207,232,0.4)" />
        <ul
          style={{
            paddingLeft: "1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
          }}
        >
          {[
            "Seed data covers 5 MLAs (one per major party). Expansion to all 90 MLAs requires running the scraper pipeline.",
            "Paired absences — where two MLAs of opposing parties both abstain by agreement — are excluded from vote counts where identified.",
            "Pledge categorisation involves editorial judgement. Two analysts reviewed each pledge independently; disagreements were resolved by discussion.",
            "Hansard contribution counts reflect quantity, not quality. A long substantive speech and a one-line interjection are each counted as one contribution.",
            "Register of Interests disclosures are self-reported by MLAs. We cannot independently verify the completeness of declarations.",
            "Some illustrated interests and donations use plausible synthetic data for the prototype phase. These are marked in the raw JSON.",
          ].map((limitation, i) => (
            <li
              key={i}
              style={{ ...P_STYLE, marginBottom: 0, lineHeight: 1.6 }}
            >
              {limitation}
            </li>
          ))}
        </ul>
      </section>

      {/* Section 6: Contact */}
      <section aria-labelledby="contact">
        <h2 id="contact" style={H2_STYLE}>Corrections and feedback</h2>
        <Divider color="#e8962a" />
        <p style={P_STYLE}>
          If you believe a score is wrong or a data point is inaccurate, the
          methodology is open — check the source link on any data point and raise
          a correction. We will review and update within 48 hours, and the
          on-chain hash will be updated to reflect the correction.
        </p>
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(180,207,232,0.25)",
            fontStyle: "italic",
          }}
        >
          MLA Tracker is an independent accountability project. It has no
          affiliation with any political party, Stormont, or the Electoral
          Commission.
        </p>
      </section>
    </main>
  );
}
