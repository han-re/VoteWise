"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from "recharts";

/* ── Types ── */
interface PartyScore {
  party_id: string;
  name: string;
  short_name: string;
  alignment_pct: number;
  color: string;
}

interface MlaScore {
  mla_id: string;
  name: string;
  party_id: string;
  constituency: string;
  photo_url: string;
  alignment_pct: number;
}

interface ScoreResult {
  party_alignment: PartyScore[];
  top_match: string;
  mla_alignment: MlaScore[];
}

/* ── Static party metadata (mirrors quiz_router.py _PARTY_META) ── */
const PARTY_META: Record<string, { color: string; short_name: string }> = {
  party_alliance:  { color: "#F6CB2F", short_name: "Alliance" },
  party_dup:       { color: "#D4213D", short_name: "DUP" },
  party_sinn_fein: { color: "#326760", short_name: "Sinn Féin" },
  party_uup:       { color: "#48A5DD", short_name: "UUP" },
  party_sdlp:      { color: "#2E9A41", short_name: "SDLP" },
  party_pbp:       { color: "#C0392B", short_name: "PBP" },
  party_tuv:       { color: "#4A7AB5", short_name: "TUV" },
};

/* Dominant parties — if top match is NOT one of these, show surprise callout */
const DOMINANT = new Set(["party_sinn_fein", "party_dup"]);

/* ── Page ── */
export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mlaRef = useRef<HTMLElement>(null);

  /* Read answers from sessionStorage, POST to /quiz/score */
  useEffect(() => {
    const raw = sessionStorage.getItem("votewise_quiz_answers")
             ?? sessionStorage.getItem("mandate_quiz_answers");
    // TODO: remove old-key fallback after 2026-05-24
    if (!raw) { router.replace("/quiz"); return; }

    let answers: Record<string, number>;
    try { answers = JSON.parse(raw); } catch { router.replace("/quiz"); return; }

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/quiz/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([id, value]) => ({ id, value })),
      }),
    })
      .then((r) => r.json())
      .then((data: ScoreResult) => {
        setResult(data);
        setLoading(false);
        sessionStorage.setItem("votewise_answers", raw);
        sessionStorage.setItem("votewise_results", JSON.stringify(data));
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [router]);

  /* Auto-play once result lands */
  useEffect(() => {
    if (result) audioRef.current?.play().catch(() => {});
  }, [result]);

  if (loading) return <LoadingScreen />;
  if (error || !result || result.party_alignment.length === 0) {
    return <ErrorScreen onRetry={() => router.push("/quiz")} />;
  }

  const { party_alignment, top_match, mla_alignment } = result;
  const topParty = party_alignment[0];
  const second   = party_alignment[1];
  const topMeta  = PARTY_META[top_match] ?? { color: "#b4cfe8", short_name: top_match };

  const showSurprise =
    !DOMINANT.has(top_match) ||
    (second && topParty.alignment_pct - second.alignment_pct > 20);

  /* Recharts 3: pass fill per-item rather than using deprecated Cell */
  const chartData = [...party_alignment].reverse().map((p) => ({
    ...p,
    fill: p.color,
    fillOpacity: p.party_id === top_match ? 1 : 0.32,
  }));

  return (
    <div style={{ background: "#080e1a", color: "#cddcec", fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh" }}>

      {/* Faint Stormont image — same treatment as quiz page */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: "url('/images/storm.jpg')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.06 }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,14,26,0.9) 100%)" }} />

      <div className="relative z-10">

        {/* ── Hero ── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">

          <p style={{ color: "rgba(180,207,232,0.38)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600, marginBottom: "1.6rem" }}>
            Your alignment
          </p>

          <p style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", color: "rgba(180,207,232,0.55)", marginBottom: "0.6rem" }}>
            You aligned most with
          </p>

          {/* Party name — glow colour matches the party, pulse matches amberPulse */}
          <h1
            style={{
              fontSize: "clamp(2.6rem, 8vw, 5.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: topMeta.color,
              textShadow: `0 0 80px ${topMeta.color}77, 0 0 30px ${topMeta.color}44, 0 3px 0 rgba(0,0,0,1), 0 6px 20px rgba(0,0,0,1)`,
              animation: "votewiseAmberPulse 4s ease-in-out 0.5s infinite both",
              marginBottom: "0.8rem",
            }}
          >
            {topParty.name}
          </h1>

          {/* Divider — exact copy of .hero-divider */}
          <div style={{ width: "48px", height: "2px", margin: "0 auto 1.4rem", background: `linear-gradient(90deg, transparent, ${topMeta.color}, transparent)`, borderRadius: "2px" }} />

          {/* Big alignment % */}
          <div style={{ fontSize: "clamp(3.5rem, 12vw, 7rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#e8962a", textShadow: "0 0 60px rgba(232,150,42,0.5), 0 4px 16px rgba(0,0,0,1)" }}>
            {topParty.alignment_pct}%
          </div>
          <p style={{ fontSize: "0.76rem", color: "rgba(180,207,232,0.3)", marginTop: "0.5rem", letterSpacing: "0.08em" }}>
            policy alignment
          </p>

          {/* Surprise callout */}
          {showSurprise && (
            <div style={{ maxWidth: "520px", marginTop: "2rem", background: "rgba(232,150,42,0.07)", border: "1px solid rgba(232,150,42,0.22)", borderLeft: "3px solid #e8962a", borderRadius: "10px", padding: "0.9rem 1.1rem", fontSize: "0.8rem", color: "rgba(215,228,242,0.7)", lineHeight: 1.6, textAlign: "left" as const }}>
              <span style={{ color: "#e8962a", fontWeight: 700 }}>You might be surprised.</span>{" "}
              {!DOMINANT.has(top_match)
                ? `Most voters in Northern Ireland back SF or the DUP on tribal lines. Your answers align closest with ${topParty.short_name ?? topParty.name} — a party many people never seriously consider.`
                : `Your top match is ${topParty.alignment_pct - (second?.alignment_pct ?? 0)} points ahead of your second-closest party — a strong alignment, not a marginal preference.`}
            </div>
          )}

          {/* CTA — matches .back-btn style */}
          <button
            onClick={() => mlaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{ marginTop: "2.5rem", background: "transparent", border: "1px solid rgba(180,207,232,0.2)", borderRadius: "24px", padding: "0.6rem 1.6rem", color: "rgba(180,207,232,0.6)", fontSize: "0.82rem", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.25s ease" }}
            onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = "#b4cfe8"; b.style.color = "#b4cfe8"; b.style.background = "rgba(180,207,232,0.07)"; }}
            onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = "rgba(180,207,232,0.2)"; b.style.color = "rgba(180,207,232,0.6)"; b.style.background = "transparent"; }}
          >
            See your matched MLAs ↓
          </button>
        </section>

        {/* ── Bar chart ── */}
        <section className="max-w-2xl mx-auto px-4 pb-16">
          <SectionHeader title="Alignment Breakdown" subtitle="How your answers compare across all seven parties" accentColor={topMeta.color} />

          <div style={cardStyle()}>
            <TopStripe color={topMeta.color} />
            <ResponsiveContainer width="100%" height={290}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 8, right: 52, top: 6, bottom: 6 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="short_name"
                  width={64}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(180,207,232,0.5)", fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                />
                <Bar
                  dataKey="alignment_pct"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="alignment_pct"
                    position="right"
                    formatter={(v: unknown) => `${v}%`}
                    style={{ fill: "rgba(180,207,232,0.5)", fontSize: 11, fontFamily: "'Segoe UI', system-ui, sans-serif" } as CSSProperties}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ── Audio briefing ── */}
        <section className="max-w-2xl mx-auto px-4 pb-16">
          <SectionHeader title="Your Personalised Briefing" subtitle="90-second audio summary — anchored on the Solana blockchain" accentColor="#b4cfe8" />

          <div style={cardStyle()}>
            <TopStripe color="#b4cfe8" />
            <audio
              ref={audioRef}
              src={`/audio/result-${top_match}.mp3`}
              onCanPlay={() => setAudioReady(true)}
              onPlay={() => setAudioPlaying(true)}
              onPause={() => setAudioPlaying(false)}
              onEnded={() => setAudioPlaying(false)}
            />

            <div className="flex items-center gap-4">
              {/* Play / pause — same circular button style as profile-avatar */}
              <button
                onClick={() => {
                  if (!audioRef.current) return;
                  audioPlaying
                    ? audioRef.current.pause()
                    : audioRef.current.play().catch(() => {});
                }}
                style={{
                  width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                  background: audioPlaying ? "rgba(232,150,42,0.12)" : "rgba(180,207,232,0.07)",
                  border: `1px solid ${audioPlaying ? "#e8962a" : "rgba(180,207,232,0.18)"}`,
                  color: audioPlaying ? "#e8962a" : "#b4cfe8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s ease",
                  boxShadow: audioPlaying ? "0 0 20px rgba(232,150,42,0.3)" : "none",
                }}
              >
                {audioPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "rgba(215,228,242,0.9)", marginBottom: "0.2rem" }}>
                  {topParty.short_name ?? topParty.name} Briefing
                </p>
                <p style={{ fontSize: "0.71rem", color: "rgba(180,207,232,0.32)" }}>
                  {audioPlaying ? "Playing..." : audioReady ? "Click to play" : "Loading audio..."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MLA matches ── */}
        <section ref={mlaRef} className="max-w-4xl mx-auto px-4 pb-24">
          <SectionHeader title="Your Matched MLAs" subtitle="Assembly members whose voting records most closely match your answers" accentColor="#e8962a" />

          {mla_alignment.length === 0 ? (
            <p style={{ textAlign: "center", color: "rgba(180,207,232,0.25)", fontSize: "0.8rem", padding: "3rem 0" }}>
              MLA data not yet seeded.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mla_alignment.map((mla, i) => {
                const meta = PARTY_META[mla.party_id] ?? { color: "#b4cfe8", short_name: "" };
                return (
                  <MlaCard key={mla.mla_id} mla={mla} meta={meta} delay={i * 0.07} />
                );
              })}
            </div>
          )}
        </section>

        <p style={{ textAlign: "center", paddingBottom: "3rem", fontSize: "0.64rem", color: "rgba(180,207,232,0.14)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
          VoteWise &nbsp;·&nbsp; Vote for the policy, not the tribe
        </p>
      </div>
    </div>
  );
}

/* ── Local components ── */

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

function TopStripe({ color }: { color: string }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: "14px 14px 0 0", opacity: 0.7 }} />
  );
}

function MlaCard({ mla, meta, delay }: { mla: MlaScore; meta: { color: string; short_name: string }; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={`/mla/${mla.mla_id}`}
      className="votewise-question-enter"
      style={{
        animationDelay: `${delay}s`,
        ...cardStyle(),
        padding: "1.4rem 1rem 1.1rem",
        display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.55rem",
        textAlign: "center" as const, textDecoration: "none", color: "inherit", cursor: "pointer",
        borderColor: hovered ? meta.color : "rgba(180,207,232,0.11)",
        boxShadow: hovered
          ? `0 0 0 1px ${meta.color}44, 0 0 28px -4px ${meta.color}66, 0 16px 48px rgba(0,0,0,0.6)`
          : "inset 0 1px 0 rgba(180,207,232,0.07)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      } as CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <TopStripe color={meta.color} />

      <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `color-mix(in srgb, ${meta.color} 18%, rgba(8,14,26,0.9))`, border: `2px solid ${meta.color}55`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.02em" }}>
        {mla.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
      </div>

      <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "rgba(215,228,242,0.9)", lineHeight: 1.25 }}>{mla.name}</p>
      <p style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.36)", lineHeight: 1.4 }}>
        {meta.short_name}<br />{mla.constituency}
      </p>

      <div style={{ display: "inline-block", fontSize: "0.71rem", fontWeight: 700, background: `color-mix(in srgb, ${meta.color} 14%, rgba(11,20,38,0.9))`, color: meta.color, border: `1px solid ${meta.color}44`, borderRadius: "20px", padding: "0.15rem 0.65rem" }}>
        {mla.alignment_pct}% aligned
      </div>
    </a>
  );
}

function LoadingScreen() {
  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "2px solid rgba(180,207,232,0.12)", borderTopColor: "#b4cfe8", borderRadius: "50%", animation: "spin 0.85s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "rgba(180,207,232,0.3)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Calculating alignment...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#e8962a", marginBottom: "1rem", fontSize: "0.88rem" }}>Could not reach the scoring service.</p>
        <button onClick={onRetry} style={{ background: "transparent", border: "1px solid rgba(180,207,232,0.18)", borderRadius: "20px", padding: "0.5rem 1.2rem", color: "#b4cfe8", cursor: "pointer", fontSize: "0.8rem" }}>
          Retake quiz
        </button>
      </div>
    </div>
  );
}

/* ── Shared style helpers ── */

function cardStyle(): CSSProperties {
  return {
    background: "rgba(11,20,38,0.82)",
    border: "1px solid rgba(180,207,232,0.11)",
    borderRadius: "14px",
    padding: "1.8rem 1.6rem",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.45)",
    position: "relative",
    overflow: "hidden",
  };
}
