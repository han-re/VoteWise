"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ChainPanel from "../../components/ChainPanel";
import VerifiedBadge from "../../components/VerifiedBadge";

/* ── Types ── */
type Vote = {
  bill: string;
  date: string;
  vote: "For" | "Against" | "Abstain";
  policy_axis: string;
  stance_value: number;
  hansard_url: string;
};

type Interest = {
  type: string;
  entity: string;
  registered_date: string;
  value: string;
};

type Donation = {
  donor: string;
  amount: number;
  date: string;
  type: string;
};

type Mla = {
  _id: string;
  name: string;
  party_id: string;
  constituency: string;
  role?: string;
  bio_short: string;
  party_line_voting_pct: number;
  votes: Vote[];
  declared_interests: Interest[];
  donations: Donation[];
};

type Tab = "overview" | "votes" | "interests" | "verification";

/* ── Design tokens — exact match to Ryan's pages ── */
const PARTY_META: Record<string, { color: string; short_name: string; name: string }> = {
  party_alliance:  { color: "#F6CB2F", short_name: "Alliance",   name: "Alliance Party" },
  party_dup:       { color: "#D4213D", short_name: "DUP",        name: "Democratic Unionist Party" },
  party_sinn_fein: { color: "#326760", short_name: "Sinn Féin",  name: "Sinn Féin" },
  party_uup:       { color: "#48A5DD", short_name: "UUP",        name: "Ulster Unionist Party" },
  party_sdlp:      { color: "#2E9A41", short_name: "SDLP",       name: "SDLP" },
  party_pbp:       { color: "#C0392B", short_name: "PBP",        name: "People Before Profit" },
  party_tuv:       { color: "#4A7AB5", short_name: "TUV",        name: "Traditional Unionist Voice" },
};

const VOTE_COLORS = {
  For:     { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",   text: "#22c55e" },
  Against: { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",   text: "#ef4444" },
  Abstain: { bg: "rgba(180,207,232,0.04)", border: "rgba(180,207,232,0.12)", text: "rgba(180,207,232,0.45)" },
};

/* quiz question → policy axis */
const QUESTION_AXIS: Record<string, string> = {
  q1: "housing", q2: "education", q3: "language",
  q4: "environment", q5: "health", q6: "equality",
  q7: "economy", q8: "welfare", q9: "integration", q10: "justice",
};

/* ── Style helpers — mirrors results/page.tsx ── */
function cardStyle(extra?: CSSProperties): CSSProperties {
  return {
    background: "rgba(11,20,38,0.82)",
    border: "1px solid rgba(180,207,232,0.11)",
    borderRadius: "14px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.45)",
    position: "relative",
    overflow: "hidden",
    ...extra,
  };
}

function TopStripe({ color }: { color: string }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: "14px 14px 0 0", opacity: 0.7 }} />
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(180,207,232,0.3)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: "0.85rem" }}>
      {text}
    </p>
  );
}

/* ── Helpers ── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function loadQuizAnswers(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem("votewise_quiz_answers")
             ?? sessionStorage.getItem("votewise_answers")
             ?? sessionStorage.getItem("mandate_quiz_answers")
             ?? sessionStorage.getItem("mandate_answers");
    // TODO: remove old-key fallback after 2026-05-24
    if (!raw) return {};
    const answers: Record<string, number> = JSON.parse(raw);
    const byAxis: Record<string, number> = {};
    for (const [qid, val] of Object.entries(answers)) {
      const axis = QUESTION_AXIS[qid];
      if (axis) byAxis[axis] = val;
    }
    return byAxis;
  } catch { return {}; }
}

function loadStoredAlignment(mlaId: string): number | null {
  try {
    const raw = sessionStorage.getItem("votewise_results")
             ?? sessionStorage.getItem("mandate_results");
    // TODO: remove old-key fallback after 2026-05-24
    if (!raw) return null;
    const r = JSON.parse(raw);
    const match = (r.mla_alignment ?? []).find((m: { mla_id: string; alignment_pct: number }) => m.mla_id === mlaId);
    return match?.alignment_pct ?? null;
  } catch { return null; }
}

function topAlignedVotes(votes: Vote[], userAnswers: Record<string, number>): Vote[] {
  if (!votes?.length) return [];
  if (Object.keys(userAnswers).length === 0) return votes.slice(0, 3);
  return [...votes]
    .map(v => ({ v, d: Math.abs((userAnswers[v.policy_axis] ?? 0) - v.stance_value) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(x => x.v);
}

/* ── Page ── */
export default function MlaPage() {
  const params = useParams();
  const id = params.id as string;
  const [mla, setMla] = useState<Mla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [alignment, setAlignment] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/mla/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setMla(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });

    setAlignment(loadStoredAlignment(id));
    setUserAnswers(loadQuizAnswers());
  }, [id]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",     label: "Overview" },
    { id: "votes",        label: "Voting Record" },
    { id: "interests",    label: "Interests" },
    { id: "verification", label: "Verification" },
  ];

  if (loading) return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(180,207,232,0.12)", borderTopColor: "#b4cfe8", borderRadius: "50%", animation: "spin 0.85s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "rgba(180,207,232,0.3)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Loading MLA profile...</p>
      </div>
    </div>
  );

  if (error || !mla) return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <p style={{ color: "#e8962a", fontSize: "0.88rem" }}>MLA not found.</p>
      <Link href="/" style={{ border: "1px solid rgba(180,207,232,0.18)", borderRadius: "20px", padding: "0.5rem 1.2rem", color: "#b4cfe8", fontSize: "0.8rem", textDecoration: "none" }}>← Back to VoteWise</Link>
    </div>
  );

  const meta = PARTY_META[mla.party_id] ?? { color: "#b4cfe8", short_name: mla.party_id, name: mla.party_id };
  const color = meta.color;
  const initials = mla.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const top3 = topAlignedVotes(mla.votes ?? [], userAnswers);

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", color: "#cddcec", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Faint Stormont background — same as quiz/results */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('/images/storm.jpg')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.06 }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,14,26,0.9) 100%)" }} />

      <div className="relative z-10">

        {/* ── Sticky nav ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,14,26,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(180,207,232,0.07)", padding: "0.8rem 2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "rgba(180,207,232,0.45)", fontSize: "0.75rem", textDecoration: "none" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#b4cfe8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(180,207,232,0.45)")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            VoteWise
          </Link>
          <span style={{ color: "rgba(180,207,232,0.18)", fontSize: "0.75rem" }}>/</span>
          <Link href={`/party/${mla.party_id}`} style={{ color, fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>{meta.short_name}</Link>
          <span style={{ color: "rgba(180,207,232,0.18)", fontSize: "0.75rem" }}>/</span>
          <span style={{ color: "#b4cfe8", fontSize: "0.75rem" }}>{mla.name}</span>
        </div>

        {/* ── Hero header ── */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" as const }}>

            {/* Identity */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2rem" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${color}18`, border: `3px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 900, color, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 900, color: "#b4cfe8", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.3rem", textShadow: "0 0 40px rgba(180,207,232,0.25)" }}>
                  {mla.name}
                </h1>
                {mla.role && <p style={{ fontSize: "0.82rem", color, fontWeight: 600, marginBottom: "0.25rem" }}>{mla.role}</p>}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" as const }}>
                  <Link href={`/party/${mla.party_id}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "rgba(180,207,232,0.45)", textDecoration: "none" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
                    {meta.name}
                  </Link>
                  <span style={{ fontSize: "0.75rem", color: "rgba(180,207,232,0.35)" }}>{mla.constituency}</span>
                </div>
              </div>
            </div>

            {/* Badge + alignment widget */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
              <VerifiedBadge politicianId={mla._id} />
              {alignment !== null && (
                <div style={{ ...cardStyle({ padding: "0.75rem 1.1rem", textAlign: "right" as const }) }}>
                  <TopStripe color={color} />
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color, lineHeight: 1 }}>{alignment}%</div>
                  <div style={{ fontSize: "0.63rem", color: "rgba(180,207,232,0.38)", marginTop: "0.15rem" }}>your alignment</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Tab bar ── */}
        <div style={{ borderBottom: "1px solid rgba(180,207,232,0.07)", padding: "0 1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
          <div style={{ display: "flex" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${color}` : "2px solid transparent", color: tab === t.id ? "#b4cfe8" : "rgba(180,207,232,0.3)", fontSize: "0.8rem", fontWeight: tab === t.id ? 700 : 400, padding: "0.75rem 1.1rem", cursor: "pointer", transition: "color 0.2s", marginBottom: -1, fontFamily: "inherit" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

              {mla.bio_short && (
                <div style={{ ...cardStyle({ padding: "1.4rem 1.6rem" }) }}>
                  <TopStripe color={color} />
                  <p style={{ fontSize: "0.88rem", color: "rgba(215,228,242,0.75)", lineHeight: 1.75, margin: 0 }}>{mla.bio_short}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" as const }}>
                {[
                  { n: `${mla.party_line_voting_pct}%`, label: "Party-line voting" },
                  { n: String((mla.votes ?? []).length), label: "Tracked votes" },
                ].map(({ n, label }) => (
                  <div key={label} style={{ flex: "1 1 160px", ...cardStyle({ padding: "1.4rem", textAlign: "center" as const }) }}>
                    <TopStripe color={color} />
                    <div style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 900, color, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.35)", marginTop: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{label}</div>
                  </div>
                ))}
              </div>

              {top3.length > 0 && (
                <div>
                  <SectionLabel text={Object.keys(userAnswers).length > 0 ? "Top votes aligned with you" : "Notable votes"} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {top3.map((v, i) => <VoteRow key={i} vote={v} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VOTING RECORD ── */}
          {tab === "votes" && (
            <div>
              <SectionLabel text={`All recorded votes (${(mla.votes ?? []).length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(mla.votes ?? []).map((v, i) => <VoteRow key={i} vote={v} />)}
                {(mla.votes ?? []).length === 0 && <p style={{ color: "rgba(180,207,232,0.28)", fontSize: "0.82rem" }}>No votes recorded.</p>}
              </div>
            </div>
          )}

          {/* ── INTERESTS ── */}
          {tab === "interests" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>

              <div>
                <SectionLabel text="Declared Interests" />
                {(mla.declared_interests ?? []).length > 0 ? (
                  <div style={{ ...cardStyle({ overflow: "auto" }) }}>
                    <TopStripe color={color} />
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.07)" }}>
                          {["Type", "Entity", "Registered", "Value"].map(h => (
                            <th key={h} style={{ padding: "0.85rem 1.2rem", textAlign: "left" as const, color: "rgba(180,207,232,0.3)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(mla.declared_interests ?? []).map((item, i) => (
                          <tr key={i} style={{ borderBottom: i < (mla.declared_interests?.length ?? 0) - 1 ? "1px solid rgba(180,207,232,0.04)" : "none" }}>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(180,207,232,0.6)" }}>{item.type}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(215,228,242,0.85)", fontWeight: 600 }}>{item.entity}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(180,207,232,0.4)" }}>{fmtDate(item.registered_date)}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(180,207,232,0.55)" }}>{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "rgba(180,207,232,0.28)", fontSize: "0.82rem" }}>No declared interests registered.</p>
                )}
              </div>

              <div>
                <SectionLabel text="Reported Donations" />
                {(mla.donations ?? []).length > 0 ? (
                  <div style={{ ...cardStyle({ overflow: "auto" }) }}>
                    <TopStripe color={color} />
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.07)" }}>
                          {["Donor", "Amount", "Date", "Type"].map(h => (
                            <th key={h} style={{ padding: "0.85rem 1.2rem", textAlign: "left" as const, color: "rgba(180,207,232,0.3)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(mla.donations ?? []).map((d, i) => (
                          <tr key={i} style={{ borderBottom: i < (mla.donations?.length ?? 0) - 1 ? "1px solid rgba(180,207,232,0.04)" : "none" }}>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(215,228,242,0.85)", fontWeight: 600 }}>{d.donor}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "#22c55e", fontWeight: 700 }}>{fmtGBP(d.amount)}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(180,207,232,0.4)" }}>{fmtDate(d.date)}</td>
                            <td style={{ padding: "0.8rem 1.2rem", color: "rgba(180,207,232,0.5)" }}>{d.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "rgba(180,207,232,0.28)", fontSize: "0.82rem" }}>No donations on record.</p>
                )}
              </div>

              <p style={{ fontSize: "0.66rem", color: "rgba(180,207,232,0.18)", fontStyle: "italic" }}>
                Interests and donations sourced from the NI Assembly Register of Members&apos; Interests and Electoral Commission records. Some entries are illustrative for demonstration purposes.
              </p>
            </div>
          )}

          {/* ── VERIFICATION ── */}
          {tab === "verification" && (
            <div>
              <SectionLabel text="Blockchain Verification" />
              <ChainPanel politicianId={mla._id} />
            </div>
          )}

        </div>

        <p style={{ textAlign: "center", paddingBottom: "3rem", fontSize: "0.64rem", color: "rgba(180,207,232,0.14)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          VoteWise &nbsp;·&nbsp; Vote for the policy, not the tribe
        </p>

      </div>
    </div>
  );
}

/* ── Vote row — shared between Overview and Voting Record tabs ── */
function VoteRow({ vote }: { vote: Vote }) {
  const vc = VOTE_COLORS[vote.vote] ?? VOTE_COLORS.Abstain;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", padding: "0.9rem 1.1rem", background: vc.bg, border: `1px solid ${vc.border}`, borderRadius: "12px" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: vc.text, border: `1px solid ${vc.border}`, borderRadius: "20px", padding: "0.15rem 0.5rem", flexShrink: 0, marginTop: "0.1rem", minWidth: 50, textAlign: "center" as const }}>
        {vote.vote}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "rgba(215,228,242,0.88)", marginBottom: "0.2rem" }}>{vote.bill}</div>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.38)" }}>{fmtDate(vote.date)}</span>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "rgba(232,150,42,0.1)", color: "#e8962a", border: "1px solid rgba(232,150,42,0.22)", borderRadius: "20px", padding: "0.05rem 0.4rem" }}>
            {vote.policy_axis}
          </span>
        </div>
      </div>
      {vote.hansard_url && (
        <a href={vote.hansard_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.66rem", color: "#60a5fa", textDecoration: "none", flexShrink: 0, marginTop: "0.1rem" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
          Hansard
        </a>
      )}
    </div>
  );
}
