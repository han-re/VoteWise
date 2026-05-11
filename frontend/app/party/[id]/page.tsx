"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/* ── Types ── */
type PromiseItem = {
  id: string;
  title: string;
  category: string;
  status: "kept" | "in_progress" | "broken";
  evidence: string;
  source_url: string;
};

type Party = {
  _id: string;
  name: string;
  short_name: string;
  leader: string;
  seats_2022: number;
  ideology: string;
  primary_color: string;
  manifesto_summary: string;
  promises: PromiseItem[];
  scorecard_summary: { kept: number; in_progress: number; broken: number };
};

type Mla = {
  _id: string;
  name: string;
  constituency: string;
  role?: string;
  bio_short: string;
  party_line_voting_pct: number;
  placeholder?: boolean;
};

/* ── Design tokens — exact match to Ryan's quiz/results pages ── */
const PARTY_META: Record<string, { color: string; short_name: string }> = {
  party_alliance:  { color: "#F6CB2F", short_name: "Alliance" },
  party_dup:       { color: "#D4213D", short_name: "DUP" },
  party_sinn_fein: { color: "#326760", short_name: "Sinn Féin" },
  party_uup:       { color: "#48A5DD", short_name: "UUP" },
  party_sdlp:      { color: "#2E9A41", short_name: "SDLP" },
  party_pbp:       { color: "#C0392B", short_name: "PBP" },
  party_tuv:       { color: "#4A7AB5", short_name: "TUV" },
};

const STATUS_META = {
  kept:        { label: "Kept",        color: "#22c55e" },
  in_progress: { label: "In Progress", color: "#eab308" },
  broken:      { label: "Broken",      color: "#ef4444" },
};

/* ── Shared style helpers — mirrors results/page.tsx ── */
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

function SectionHeader({ title, subtitle, accentColor }: { title: string; subtitle: string; accentColor: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", fontWeight: 700, color: "#b4cfe8", textShadow: "0 0 30px rgba(180,207,232,0.2)", marginBottom: "0.4rem" }}>
        {title}
      </h2>
      <div style={{ width: "40px", height: "2px", margin: "0 auto 0.6rem", background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, borderRadius: "2px" }} />
      <p style={{ fontSize: "0.78rem", color: "rgba(180,207,232,0.33)" }}>{subtitle}</p>
    </div>
  );
}

/* ── MLA card — exact visual match to results page MlaCard ── */
function MlaCard({ mla, partyColor, delay }: { mla: Mla; partyColor: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const initials = mla.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/mla/${mla._id}`}
      className="votewise-question-enter"
      style={{
        animationDelay: `${delay}s`,
        ...cardStyle({
          padding: "1.4rem 1rem 1.1rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem",
          textAlign: "center", textDecoration: "none", color: "inherit", cursor: "pointer",
          borderColor: hovered ? partyColor : "rgba(180,207,232,0.11)",
          boxShadow: hovered
            ? `0 0 0 1px ${partyColor}44, 0 0 28px -4px ${partyColor}66, 0 16px 48px rgba(0,0,0,0.6)`
            : "inset 0 1px 0 rgba(180,207,232,0.07)",
          transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
          transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }),
      } as CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <TopStripe color={partyColor} />

      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(180,207,232,0.07)", border: `2px solid ${partyColor}33`, display: "flex", alignItems: "center", justifyContent: "center", color: partyColor, fontSize: "1rem", fontWeight: 900, flexShrink: 0 }}>
        {initials}
      </div>

      <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "rgba(215,228,242,0.9)", lineHeight: 1.25, margin: 0 }}>{mla.name}</p>

      {mla.role && (
        <p style={{ fontSize: "0.68rem", color: partyColor, fontWeight: 600, margin: 0 }}>{mla.role}</p>
      )}

      <p style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.36)", lineHeight: 1.4, margin: 0 }}>{mla.constituency}</p>

      {mla.bio_short && (
        <p style={{ fontSize: "0.71rem", color: "rgba(180,207,232,0.45)", lineHeight: 1.5, margin: 0, textAlign: "left" as const }}>{mla.bio_short}</p>
      )}

      <div style={{ marginTop: "auto", fontSize: "0.68rem", color: "rgba(180,207,232,0.35)" }}>
        View profile →
      </div>
    </Link>
  );
}

/* ── Promise row ── */
function PromiseRow({ promise }: { promise: PromiseItem }) {
  const meta = STATUS_META[promise.status];
  return (
    <div style={{ ...cardStyle({ padding: "1rem 1.2rem", marginBottom: "0.5rem" }) }}>
      <TopStripe color={meta.color} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, boxShadow: `0 0 6px ${meta.color}80`, flexShrink: 0, marginTop: "0.4rem" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const, marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(215,228,242,0.9)" }}>{promise.title}</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, background: "rgba(232,150,42,0.12)", color: "#e8962a", border: "1px solid rgba(232,150,42,0.25)", borderRadius: "20px", padding: "0.1rem 0.45rem" }}>
              {promise.category}
            </span>
          </div>
          <p style={{ fontSize: "0.76rem", color: "rgba(180,207,232,0.55)", lineHeight: 1.55, margin: 0 }}>{promise.evidence}</p>
          {promise.source_url && !promise.source_url.includes("placeholder") && (
            <a href={promise.source_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem", color: "#60a5fa", textDecoration: "none", marginTop: "0.3rem" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
              Source
            </a>
          )}
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: meta.color, flexShrink: 0 }}>{meta.label}</span>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function PartyPage() {
  const params = useParams();
  const id = params.id as string;
  const [party, setParty] = useState<Party | null>(null);
  const [mlas, setMlas] = useState<Mla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    Promise.all([
      fetch(`${base}/party/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${base}/party/${id}/mlas`).then(r => r.json()),
    ])
      .then(([p, m]) => { setParty(p); setMlas(Array.isArray(m) ? m : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(180,207,232,0.12)", borderTopColor: "#b4cfe8", borderRadius: "50%", animation: "spin 0.85s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "rgba(180,207,232,0.3)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Loading party data...</p>
      </div>
    </div>
  );

  if (error || !party) return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <p style={{ color: "#e8962a", fontSize: "0.88rem" }}>Party not found.</p>
      <Link href="/" style={{ background: "transparent", border: "1px solid rgba(180,207,232,0.18)", borderRadius: "20px", padding: "0.5rem 1.2rem", color: "#b4cfe8", fontSize: "0.8rem", textDecoration: "none" }}>← Back to VoteWise</Link>
    </div>
  );

  const meta = PARTY_META[party._id] ?? { color: party.primary_color, short_name: party.short_name };
  const color = meta.color;
  const { kept, in_progress, broken } = party.scorecard_summary;
  const total = kept + in_progress + broken;
  const realMlas = mlas.filter(m => !m.placeholder);

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", color: "#cddcec", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Faint Stormont background — same as quiz/results */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('/images/storm.jpg')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.06 }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,14,26,0.9) 100%)" }} />

      <div className="relative z-10">

        {/* ── Sticky nav ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,14,26,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(180,207,232,0.07)", padding: "0.8rem 2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "rgba(180,207,232,0.45)", fontSize: "0.75rem", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#b4cfe8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(180,207,232,0.45)")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            VoteWise
          </Link>
          <span style={{ color: "rgba(180,207,232,0.18)", fontSize: "0.75rem" }}>/</span>
          <span style={{ color, fontSize: "0.75rem", fontWeight: 700 }}>{party.short_name}</span>
        </div>

        {/* ── Party hero ── */}
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p style={{ color: "rgba(180,207,232,0.38)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600, marginBottom: "1.4rem" }}>
            Party Scorecard
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 16, background: `${color}18`, border: `2px solid ${color}44`, fontSize: "1.1rem", fontWeight: 900, color, letterSpacing: "-0.02em", marginBottom: "1.2rem" }}>
            {party.short_name.slice(0, 3)}
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.6rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#b4cfe8", textShadow: "0 0 80px rgba(180,207,232,0.3), 0 3px 0 rgba(0,0,0,1), 0 6px 20px rgba(0,0,0,1)", lineHeight: 1.1, marginBottom: "0.8rem" }}>
            {party.name}
          </h1>

          <div style={{ width: "48px", height: "2px", margin: "0 auto 1.2rem", background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: "2px" }} />

          <div style={{ display: "flex", justifyContent: "center", gap: "1.6rem", flexWrap: "wrap" as const, marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(180,207,232,0.5)" }}>
              <span style={{ color: "rgba(180,207,232,0.28)", marginRight: "0.35rem" }}>Leader</span>{party.leader}
            </span>
            <span style={{ fontSize: "0.8rem", color: "rgba(180,207,232,0.5)" }}>
              <span style={{ color: "rgba(180,207,232,0.28)", marginRight: "0.35rem" }}>Seats 2022</span>{party.seats_2022}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color, fontWeight: 600 }}>{party.ideology}</p>

          {party.manifesto_summary && (
            <p style={{ maxWidth: 600, margin: "1.4rem auto 0", fontSize: "0.82rem", color: "rgba(180,207,232,0.45)", lineHeight: 1.75, borderLeft: `3px solid ${color}40`, paddingLeft: "1rem", textAlign: "left" as const }}>
              {party.manifesto_summary}
            </p>
          )}
        </section>

        {/* ── Scorecard summary ── */}
        <section className="max-w-3xl mx-auto px-4 pb-14">
          <SectionHeader title="2022 Manifesto Scorecard" subtitle="How the party's promises compare to their record in government" accentColor={color} />

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" as const }}>
            {[
              { count: kept,        label: "Kept",        c: "#22c55e" },
              { count: in_progress, label: "In Progress", c: "#eab308" },
              { count: broken,      label: "Broken",      c: "#ef4444" },
            ].map(({ count, label, c }) => (
              <div key={label} style={{ flex: "1 1 140px", ...cardStyle({ padding: "1.6rem 1.4rem", textAlign: "center" as const }) }}>
                <TopStripe color={c} />
                <div style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)", fontWeight: 900, color: c, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: c, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: "0.4rem", opacity: 0.85 }}>{label}</div>
                <div style={{ fontSize: "0.63rem", color: "rgba(180,207,232,0.28)", marginTop: "0.2rem" }}>of {total} pledges</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Promise tracker ── */}
        <section className="max-w-3xl mx-auto px-4 pb-14">
          <SectionHeader title="Promise Tracker" subtitle="Every 2022 manifesto commitment tracked against the record" accentColor="#e8962a" />

          {(["kept", "in_progress", "broken"] as const).map(status => {
            const group = party.promises.filter(p => p.status === status);
            if (group.length === 0) return null;
            const sm = STATUS_META[status];
            return (
              <div key={status} style={{ marginBottom: "1.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.color, boxShadow: `0 0 8px ${sm.color}` }} />
                  <h3 style={{ fontSize: "0.72rem", fontWeight: 700, color: sm.color, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0 }}>
                    {sm.label} ({group.length})
                  </h3>
                </div>
                {group.map(p => <PromiseRow key={p.id} promise={p} />)}
              </div>
            );
          })}
        </section>

        {/* ── MLAs ── */}
        {realMlas.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-24">
            <SectionHeader title="Party MLAs" subtitle="Assembly members representing this party — click to view their full profile" accentColor={color} />
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {realMlas.map((mla, i) => (
                <MlaCard key={mla._id} mla={mla} partyColor={color} delay={i * 0.08} />
              ))}
            </div>
          </section>
        )}

        <p style={{ textAlign: "center", paddingBottom: "3rem", fontSize: "0.64rem", color: "rgba(180,207,232,0.14)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          VoteWise &nbsp;·&nbsp; Vote for the policy, not the tribe
        </p>

      </div>
    </div>
  );
}
