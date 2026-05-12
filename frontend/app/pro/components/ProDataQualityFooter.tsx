"use client";

import type { CSSProperties } from "react";

export function ProDataQualityFooter() {
  const style: CSSProperties = {
    borderTop: "1px solid var(--vw-pro-grid)",
    padding: "12px 32px",
    fontSize: 11.5,
    color: "rgba(180,207,232,0.5)",
    lineHeight: 1.55,
    background: "var(--vw-pro-surface)",
    textAlign: "center",
  };

  return (
    <footer style={style}>
      Donations: Electoral Commission (2010-present). Sessions: NI Assembly Hansard
      (curated subset). Last updated: 30 min ago.
    </footer>
  );
}
