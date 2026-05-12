"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  /** Inline content. If omitted and `src` is provided, the file is fetched. */
  content?: ReactNode;
  /** URL of a markdown file in /public to fetch and render as plain text. */
  src?: string;
  summary?: string;
}

export function MethodologyFootnote({
  content,
  src,
  summary = "How is this calculated?",
}: Props) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (content || !src) return;
    fetch(src)
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => setText(t))
      .catch(() => setText(null));
  }, [src, content]);

  const detailsStyle: CSSProperties = {
    background: "var(--vw-card-bg)",
    border: "1px solid var(--vw-pro-grid)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "rgba(205,220,236,0.78)",
  };

  function renderMethodology(raw: string) {
    return raw.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h2 key={index} style={{ margin: "14px 0 8px", color: "#e6eef7", fontSize: 17, fontWeight: 700 }}>
            {line.slice(2)}
          </h2>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={index} style={{ margin: "12px 0 7px", color: "#cddcec", fontSize: 15, fontWeight: 700 }}>
            {line.slice(3)}
          </h3>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <p key={index} style={{ margin: "4px 0 4px 14px" }}>
            &bull; {line.slice(2).replace(/\*\*/g, "")}
          </p>
        );
      }
      if (!line.trim()) return <div key={index} style={{ height: 6 }} />;
      return (
        <p key={index} style={{ margin: "4px 0" }}>
          {line.replace(/\*\*/g, "")}
        </p>
      );
    });
  }

  return (
    <details style={detailsStyle}>
      <summary
        style={{
          cursor: "pointer",
          color: "var(--vw-pro-cyan)",
          fontSize: 12.5,
          letterSpacing: "0.02em",
        }}
      >
        {summary}
      </summary>
      <div style={{ marginTop: 10, lineHeight: 1.55 }}>
        {content ?? (text ? renderMethodology(text) : "Methodology not available.")}
      </div>
    </details>
  );
}
