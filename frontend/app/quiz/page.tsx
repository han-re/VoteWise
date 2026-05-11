"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  axis: string;
  question: string;
  axis_label: string;
}

const ANSWER_OPTIONS = [
  { value: -2, short: "SD", label: "Strongly\nDisagree", color: "#ef4444" },
  { value: -1, short: "D",  label: "Disagree",           color: "#f97316" },
  { value:  0, short: "N",  label: "Neutral",            color: "#b4cfe8" },
  { value:  1, short: "A",  label: "Agree",              color: "#eab308" },
  { value:  2, short: "SA", label: "Strongly\nAgree",    color: "#22c55e" },
] as const;

const FALLBACK_QUESTIONS: Question[] = [
  { id: "q1",  axis: "housing",     question: "Private rents should be capped as a percentage of tenant income.", axis_label: "Housing Intervention" },
  { id: "q2",  axis: "education",   question: "Academic selection at age 11 should be abolished.",                axis_label: "Education Reform" },
  { id: "q3",  axis: "language",    question: "Irish should have equal legal status to English in NI.",            axis_label: "Language and Identity" },
  { id: "q4",  axis: "environment", question: "NI should commit to net zero by 2035, not 2050.",                  axis_label: "Climate Ambition" },
  { id: "q5",  axis: "health",      question: "Private companies should be removed from delivering NHS services.", axis_label: "Health Privatisation" },
  { id: "q6",  axis: "equality",    question: "A standalone Hate Crime Bill should be passed without delay.",     axis_label: "Equality Legislation" },
  { id: "q7",  axis: "economy",     question: "Corporation tax in NI should be cut below the UK rate.",           axis_label: "Economic Policy" },
  { id: "q8",  axis: "welfare",     question: "Welfare cuts should be mitigated locally regardless of cost.",     axis_label: "Welfare Protection" },
  { id: "q9",  axis: "integration", question: "Cross-border cooperation with Ireland should be deepened.",        axis_label: "All-Island Integration" },
  { id: "q10", axis: "justice",     question: "Legacy cases from the Troubles should be reopened, not closed.",   axis_label: "Legacy and Justice" },
];

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/quiz/questions`)
      .then((r) => r.json())
      .then((data: Question[]) => { if (Array.isArray(data) && data.length) setQuestions(data); })
      .catch(() => {});
  }, []);

  const pick = (value: number) => {
    if (selected !== null || isExiting) return;
    setSelected(value);

    const q = questions[index];
    const newAnswers = { ...answers, [q.id]: value };

    // 200ms: show selection feedback, then begin exit
    setTimeout(() => {
      setIsExiting(true);
      // 260ms: exit animation plays, then advance
      setTimeout(() => {
        if (index + 1 >= questions.length) {
          sessionStorage.setItem("votewise_quiz_answers", JSON.stringify(newAnswers));
          router.push("/results");
        } else {
          setAnswers(newAnswers);
          setIndex((i) => i + 1);
          setSelected(null);
          setIsExiting(false);
        }
      }, 260);
    }, 200);
  };

  const q = questions[index];
  const total = questions.length;
  const progressPct = Math.round((index / total) * 100);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#080e1a", color: "#cddcec", fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Faint Stormont background — same image as homepage, opacity 0.07 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/storm.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.07,
        }}
      />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(8,14,26,0.85) 100%)",
        }}
      />

      {/* Quiz progress bar — repurposed shimmer bar, driven by state not scroll */}
      <div
        className="fixed top-0 left-0 z-50 pointer-events-none"
        style={{
          height: "2px",
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, #e8962a, #b4cfe8, #e8962a)",
          backgroundSize: "200% 100%",
          animation: "votewiseShimmerBar 3s linear infinite",
          transition: "width 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-7">

        {/* Step counter + dot indicator */}
        <div className="flex flex-col items-center gap-3 w-full">
          <p
            style={{
              color: "rgba(180,207,232,0.38)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Question {index + 1} of {total}
          </p>

          {/* Pill-dot step indicator — same aesthetic as the hero divider */}
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  height: "5px",
                  width: i === index ? "22px" : "5px",
                  borderRadius: "3px",
                  background:
                    i < index
                      ? "#e8962a"
                      : i === index
                      ? "#b4cfe8"
                      : "rgba(180,207,232,0.13)",
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: i === index ? "0 0 8px rgba(180,207,232,0.4)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Question card — key forces remount on each new question so animation re-fires */}
        <div
          key={`question-${index}`}
          className={isExiting ? "votewise-question-exit" : "votewise-question-enter"}
          style={{
            width: "100%",
            background: "rgba(11,20,38,0.82)",
            border: "1px solid rgba(180,207,232,0.11)",
            borderRadius: "14px",
            padding: "2.5rem 2.2rem 2.2rem",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow:
              "inset 0 1px 0 rgba(180,207,232,0.07), 0 24px 64px rgba(0,0,0,0.55)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent stripe — matches party card ::before */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "3px",
              background: "linear-gradient(90deg, transparent, rgba(180,207,232,0.6), transparent)",
              borderRadius: "14px 14px 0 0",
            }}
          />

          {/* Shimmer sweep — matches party card ::after */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(110deg, transparent 30%, rgba(180,207,232,0.04) 50%, transparent 70%)",
              backgroundSize: "250% 100%",
              backgroundPosition: "150% 0",
            }}
          />

          {/* Axis label badge — same style as .policy-badge */}
          <div
            style={{
              display: "inline-block",
              fontSize: "0.61rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "rgba(232,150,42,0.12)",
              color: "#e8962a",
              border: "1px solid rgba(232,150,42,0.25)",
              borderRadius: "20px",
              padding: "0.15rem 0.7rem",
              marginBottom: "1.4rem",
            }}
          >
            {q.axis_label}
          </div>

          {/* Question text — same glow treatment as hero h1 */}
          <p
            style={{
              fontSize: "clamp(1.2rem, 3vw, 1.65rem)",
              fontWeight: 700,
              lineHeight: 1.38,
              color: "#b4cfe8",
              textShadow:
                "0 0 60px rgba(180,207,232,0.2), 0 2px 8px rgba(0,0,0,0.9)",
              margin: 0,
            }}
          >
            {q.question}
          </p>

          {/* Subtle bottom rule */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(180,207,232,0.08), transparent)",
              marginTop: "1.8rem",
            }}
          />
        </div>

        {/* Answer buttons — 5 across, styled as compact party cards */}
        <div
          className="w-full grid gap-2.5"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >
          {ANSWER_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => pick(opt.value)}
                disabled={selected !== null}
                className="votewise-answer-btn"
                style={
                  {
                    "--btn-color": opt.color,
                    background: isSelected
                      ? `color-mix(in srgb, ${opt.color} 18%, rgba(11,20,38,0.9))`
                      : "rgba(11,20,38,0.82)",
                    border: `1px solid ${
                      isSelected ? opt.color : "rgba(180,207,232,0.11)"
                    }`,
                    borderRadius: "12px",
                    padding: "1.1rem 0.4rem 1rem",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    cursor: selected !== null ? "default" : "pointer",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: isSelected
                      ? `0 0 0 1px ${opt.color}55, 0 0 28px -4px ${opt.color}88`
                      : "inset 0 1px 0 rgba(180,207,232,0.05)",
                  } as CSSProperties
                }
              >
                {/* Top colour stripe — exact copy of party card ::before */}
                <div
                  className="votewise-btn-stripe"
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: isSelected ? "4px" : "3px",
                    background: opt.color,
                    borderRadius: "12px 12px 0 0",
                    opacity: isSelected ? 1 : 0.65,
                    transition: "height 0.2s ease, opacity 0.2s ease",
                  }}
                />

                {/* Abbreviation */}
                <span
                  className="votewise-btn-short"
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    letterSpacing: "-0.01em",
                    color: isSelected ? opt.color : "rgba(215,228,242,0.88)",
                    textShadow: isSelected ? `0 0 18px ${opt.color}` : "none",
                    transition: "color 0.2s ease, text-shadow 0.2s ease",
                    lineHeight: 1,
                  }}
                >
                  {opt.short}
                </span>

                {/* Full label */}
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: isSelected
                      ? "rgba(215,228,242,0.75)"
                      : "rgba(180,207,232,0.35)",
                    textAlign: "center",
                    lineHeight: 1.35,
                    transition: "color 0.2s ease",
                    whiteSpace: "pre-line",
                  }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* VoteWise tagline — mirrors the legal/branding footer in index.html */}
        <p
          style={{
            fontSize: "0.66rem",
            color: "rgba(180,207,232,0.18)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          VoteWise &nbsp;·&nbsp; Vote for the policy, not the tribe
        </p>
      </div>
    </div>
  );
}
