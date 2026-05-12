"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { useSetProPage } from "../components/ProPageContext";

interface Tier {
  name: string;
  tagline: string;
  price: string;
  pricePeriod?: string;
  features: string[];
  cta: ReactNode;
  highlight?: boolean;
}

const cardStyle: CSSProperties = {
  background: "var(--vw-card-bg)",
  border: "1px solid var(--vw-border)",
  borderRadius: 12,
  padding: "26px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const highlightCardStyle: CSSProperties = {
  ...cardStyle,
  border: "1px solid var(--vw-pro-cyan)",
  boxShadow: "0 0 24px -8px var(--vw-pro-cyan-dim)",
};

const featureStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "rgba(205,220,236,0.78)",
  lineHeight: 1.5,
};

const checkStyle: CSSProperties = {
  color: "var(--vw-pro-cyan)",
  fontFamily: "var(--vw-pro-mono)",
  flexShrink: 0,
  marginTop: 2,
};

function PricingCta({
  label,
  primary,
  onClick,
  href,
}: {
  label: string;
  primary?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const baseStyle: CSSProperties = {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    textDecoration: "none",
    border: primary ? "none" : "1px solid var(--vw-pro-grid)",
    background: primary ? "var(--vw-accent)" : "transparent",
    color: primary ? "#0b1426" : "var(--vw-pro-cyan)",
    cursor: "pointer",
    width: "100%",
  };
  if (href) {
    return (
      <a href={href} style={baseStyle}>
        {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={baseStyle}>
      {label}
    </button>
  );
}

export default function PricingPage() {
  useSetProPage("Pricing", ["Pricing"]);
  const router = useRouter();

  const tiers: Tier[] = [
    {
      name: "Free",
      tagline: "For voters.",
      price: "£0",
      features: [
        "VoteWise alignment quiz",
        "Party scorecards and promise tracker",
        "MLA profiles with voting record",
        "Solana chain-verified records",
      ],
      cta: <PricingCta label="Use the free product" href="/" />,
    },
    {
      name: "Newsroom",
      tagline: "For journalists and researchers.",
      price: "£99",
      pricePeriod: "per month",
      features: [
        "Everything in Free",
        "Donations & spending dashboard with filters",
        "Stormont attendance & engagement leaderboard",
        "Curated sessions feed and per-session chatbot",
        "Priority email support",
      ],
      cta: (
        <PricingCta
          label="Start 14-day trial"
          primary
          onClick={() => {
            localStorage.setItem("votewise_pro_demo_org", "Belfast Telegraph (Trial)");
            router.push("/pro");
          }}
        />
      ),
      highlight: true,
    },
    {
      name: "Enterprise",
      tagline: "For organisations.",
      price: "Contact us",
      features: [
        "Everything in Newsroom",
        "API access for newsroom CMS integration",
        "Custom data feeds and bespoke ingests",
        "Multi-seat with role-based access",
        "Dedicated account manager and SLA",
      ],
      cta: <PricingCta label="Contact sales" href="mailto:rehanananth@gmail.com?subject=VoteWise%20Enterprise" />,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <header style={{ textAlign: "center", maxWidth: 720, margin: "8px auto 4px" }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#e6eef7", letterSpacing: "-0.01em" }}>
          Pricing for VoteWise Pro
        </h1>
        <p style={{ margin: "10px 0 0", color: "rgba(205,220,236,0.6)", fontSize: 14, lineHeight: 1.6 }}>
          Free for voters. Newsroom tier for the people who report on what the data shows.
          Enterprise for organisations who want it on tap.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        {tiers.map((t) => (
          <article key={t.name} style={t.highlight ? highlightCardStyle : cardStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#e6eef7" }}>{t.name}</h2>
              <p style={{ margin: "4px 0 14px", color: "rgba(180,207,232,0.6)", fontSize: 13 }}>
                {t.tagline}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    fontFamily: "var(--vw-pro-mono)",
                    color: t.highlight ? "var(--vw-accent)" : "#e6eef7",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.price}
                </span>
                {t.pricePeriod && (
                  <span style={{ color: "rgba(180,207,232,0.55)", fontSize: 12 }}>
                    {t.pricePeriod}
                  </span>
                )}
              </div>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {t.features.map((f) => (
                <li key={f} style={featureStyle}>
                  <span style={checkStyle}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: "auto" }}>{t.cta}</div>
          </article>
        ))}
      </section>

      <p style={{ textAlign: "center", color: "rgba(180,207,232,0.45)", fontSize: 11.5, marginTop: 16 }}>
        Newsroom and Enterprise pricing inclusive of VAT where applicable. The trial seeds your demo
        organisation against the Belfast Telegraph profile and routes to the live dashboard.
      </p>
    </div>
  );
}
