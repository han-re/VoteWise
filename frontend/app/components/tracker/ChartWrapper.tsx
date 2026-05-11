"use client";

import { useState, useCallback, type CSSProperties } from "react";
import Link from "next/link";

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  caveat?: string;
  csvFilename?: string;
  csvHeaders?: string[];
  csvRows?: (string | number)[][];
  tableData?: TableData;
  children: React.ReactNode;
  accentColor?: string;
  style?: CSSProperties;
}

function downloadCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const escape = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

export default function ChartWrapper({
  title,
  subtitle,
  caveat,
  csvFilename,
  csvHeaders,
  csvRows,
  tableData,
  children,
  accentColor = "#e8962a",
  style,
}: ChartWrapperProps) {
  const [showTable, setShowTable] = useState(false);

  const hasCsv = csvFilename && csvHeaders && csvRows;
  const hasTable = tableData || hasCsv;

  const handleDownload = useCallback(() => {
    if (!hasCsv) return;
    downloadCSV(csvHeaders, csvRows, csvFilename);
  }, [hasCsv, csvHeaders, csvRows, csvFilename]);

  const displayHeaders = tableData?.headers ?? csvHeaders ?? [];
  const displayRows =
    tableData?.rows ?? csvRows?.map((r) => r.map(String)) ?? [];

  return (
    <div style={{ ...CARD, ...style }}>
      {/* Top accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          borderRadius: "14px 14px 0 0",
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      <div style={{ padding: "1.6rem 1.6rem 0.8rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: subtitle ? "0.3rem" : "1rem",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color: "#b4cfe8",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>

          {/* Controls: table toggle + download */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }}>
            {hasTable && (
              <button
                onClick={() => setShowTable((v) => !v)}
                aria-pressed={showTable}
                style={{
                  background: showTable
                    ? "rgba(180,207,232,0.12)"
                    : "transparent",
                  border: "1px solid rgba(180,207,232,0.16)",
                  borderRadius: "20px",
                  padding: "0.2rem 0.65rem",
                  color: "rgba(180,207,232,0.5)",
                  fontSize: "0.64rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  letterSpacing: "0.04em",
                }}
              >
                {showTable ? "Chart" : "Table"}
              </button>
            )}
            {hasCsv && (
              <button
                onClick={handleDownload}
                title="Download data as CSV"
                aria-label="Download chart data as CSV"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(180,207,232,0.12)",
                  borderRadius: "20px",
                  padding: "0.2rem 0.65rem",
                  color: "rgba(180,207,232,0.4)",
                  fontSize: "0.64rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  transition: "all 0.2s",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                CSV
              </button>
            )}
          </div>
        </div>

        {subtitle && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "rgba(180,207,232,0.33)",
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart or table */}
      <div style={{ padding: "0 1.6rem" }}>
        {showTable && displayHeaders.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.76rem",
              }}
              aria-label={title}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.08)" }}>
                  {displayHeaders.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      style={{
                        padding: "0.6rem 0.75rem",
                        textAlign: "left",
                        color: "rgba(180,207,232,0.35)",
                        fontWeight: 600,
                        fontSize: "0.62rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{
                      borderBottom:
                        ri < displayRows.length - 1
                          ? "1px solid rgba(180,207,232,0.04)"
                          : "none",
                    }}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "0.55rem 0.75rem",
                          color:
                            ci === 0
                              ? "rgba(215,228,242,0.85)"
                              : "rgba(180,207,232,0.5)",
                          fontWeight: ci === 0 ? 600 : 400,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer: caveat + methodology link */}
      <div
        style={{
          padding: "0.8rem 1.6rem 1.2rem",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "0.4rem",
          borderTop: "1px solid rgba(180,207,232,0.04)",
        }}
      >
        {caveat ? (
          <p
            style={{
              fontSize: "0.62rem",
              color: "rgba(180,207,232,0.22)",
              lineHeight: 1.5,
              fontStyle: "italic",
              margin: 0,
              flex: 1,
            }}
          >
            {caveat}
          </p>
        ) : (
          <span />
        )}
        <Link
          href="/tracker/methodology"
          style={{
            fontSize: "0.62rem",
            color: "rgba(180,207,232,0.22)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          How is this calculated?
        </Link>
      </div>
    </div>
  );
}
