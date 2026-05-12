"use client";

import type { CSSProperties } from "react";

export interface RankingRow {
  id: string;
  name: string;
  value: number;
  /** Hex colour for the bar fill (party brand colour, etc.). Falls back to cyan. */
  color?: string;
  /** Optional small caption rendered under the name (e.g. constituency). */
  subtitle?: string;
}

interface Props {
  rows: RankingRow[];
  /** Format for the right-aligned value. */
  valueFormat?: "currency" | "pct" | "number";
  /** Click handler for the row (e.g. drill into MLA profile). */
  onRowClick?: (row: RankingRow) => void;
  /** Maximum bar width as a fraction of the row (defaults 1 = full width). */
  maxBarFraction?: number;
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const NUM = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

function format(v: number, fmt: Props["valueFormat"]): string {
  switch (fmt) {
    case "currency": return GBP.format(v);
    case "pct":      return `${NUM.format(v)}%`;
    case "number":
    default:         return NUM.format(v);
  }
}

export function RankingList({
  rows,
  valueFormat = "number",
  onRowClick,
  maxBarFraction = 1,
}: Props) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  const denom = max === 0 ? 1 : max;

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((row, i) => {
        const widthPct = (row.value / denom) * 100 * maxBarFraction;
        const fill = row.color ?? "var(--vw-pro-cyan)";
        const interactive = typeof onRowClick === "function";
        const rowStyle: CSSProperties = {
          position: "relative",
          padding: "10px 12px",
          borderTop: i === 0 ? "none" : "1px solid var(--vw-pro-grid)",
          cursor: interactive ? "pointer" : "default",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 12,
        };
        return (
          <li
            key={row.id}
            style={rowStyle}
            onClick={() => onRowClick?.(row)}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${widthPct}%`,
                background: fill,
                opacity: 0.35,
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  color: "#e6eef7",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.name}
              </div>
              {row.subtitle && (
                <div style={{ fontSize: 11.5, color: "rgba(180,207,232,0.5)" }}>
                  {row.subtitle}
                </div>
              )}
            </div>
            <div
              style={{
                position: "relative",
                fontFamily: "var(--vw-pro-mono)",
                fontSize: 13,
                color: "#cddcec",
                whiteSpace: "nowrap",
              }}
            >
              {format(row.value, valueFormat)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
