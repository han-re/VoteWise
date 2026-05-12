"use client";

import type { CSSProperties, ReactNode } from "react";

export type KpiValueFormat = "currency" | "pct" | "number" | "none";

interface Props {
  label: string;
  value: number | string;
  valueFormat?: KpiValueFormat;
  delta?: number;
  subtitle?: ReactNode;
  accent?: "amber" | "cyan";
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

function format(value: number | string, fmt: KpiValueFormat): string {
  if (typeof value === "string") return value;
  switch (fmt) {
    case "currency": return GBP.format(value);
    case "pct":      return `${NUM.format(value)}%`;
    case "number":   return NUM.format(value);
    case "none":
    default:         return String(value);
  }
}

export function KpiTile({
  label,
  value,
  valueFormat = "none",
  delta,
  subtitle,
  accent = "amber",
}: Props) {
  const tileStyle: CSSProperties = {
    background: "var(--vw-card-bg)",
    border: "1px solid var(--vw-border)",
    borderRadius: 10,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  };

  const valueColor =
    accent === "cyan" ? "var(--vw-pro-cyan)" : "var(--vw-accent)";

  return (
    <div style={tileStyle}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(180,207,232,0.55)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--vw-pro-mono)",
          fontSize: 26,
          fontWeight: 600,
          color: valueColor,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        {format(value, valueFormat)}
      </div>
      {(typeof delta === "number" || subtitle) && (
        <div style={{ fontSize: 12, color: "rgba(205,220,236,0.55)" }}>
          {typeof delta === "number" && (
            <span
              style={{
                color: delta >= 0 ? "#7CD6A0" : "#E07B7B",
                marginRight: subtitle ? 8 : 0,
                fontFamily: "var(--vw-pro-mono)",
              }}
            >
              {delta >= 0 ? "↑" : "↓"} {NUM.format(Math.abs(delta))}%
            </span>
          )}
          {subtitle}
        </div>
      )}
    </div>
  );
}
