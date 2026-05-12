"use client";

import { type CSSProperties } from "react";
import { useProPage } from "./ProPageContext";

export function ProTopBar() {
  const { meta } = useProPage();
  const hideFreshness = meta.title === "Stormont Sessions";

  const barStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "var(--vw-pro-surface)",
    borderBottom: "1px solid var(--vw-pro-grid)",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    gap: 18,
    backdropFilter: "blur(6px)",
  };

  return (
    <header style={barStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 650,
            letterSpacing: "-0.01em",
            color: "#e6eef7",
          }}
        >
          {meta.title}
        </h1>
      </div>

      {!hideFreshness && (
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(180,207,232,0.55)",
            fontFamily: "var(--vw-pro-mono)",
            whiteSpace: "nowrap",
          }}
        >
          Data updated 30 min ago
        </div>
      )}

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderRadius: 4,
          background: "var(--vw-pro-cyan-dim)",
          color: "var(--vw-pro-cyan)",
          fontFamily: "var(--vw-pro-mono)",
        }}
      >
        PRO
      </span>
    </header>
  );
}
