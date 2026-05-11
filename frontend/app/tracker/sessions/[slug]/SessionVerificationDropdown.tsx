"use client";

import { useEffect, useRef, useState } from "react";
import TrackerVerificationPanel from "../../../components/tracker/TrackerVerificationPanel";

interface Props {
  slug: string;
  payload: unknown;
}

export function SessionVerificationDropdown({ slug, payload }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", marginLeft: "auto" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="session-verification-dropdown"
        onClick={() => setOpen((current) => !current)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: open ? "rgba(34,197,94,0.13)" : "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.26)",
          borderRadius: "6px",
          color: "#bbf7d0",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "0.05em",
          lineHeight: 1,
          padding: "0.38rem 0.7rem",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 10px rgba(34,197,94,0.65)",
          }}
        />
        Verify
      </button>

      {open && (
        <div
          id="session-verification-dropdown"
          className="tracker-hidden-scrollbar"
          style={{
            position: "absolute",
            top: "calc(100% + 0.75rem)",
            right: 0,
            zIndex: 30,
            width: "min(42rem, calc(100vw - 3rem))",
            maxHeight: "min(42rem, calc(100vh - 8rem))",
            overflowY: "auto",
            padding: "0.35rem",
            background: "rgba(5,10,20,0.94)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "12px",
            boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <TrackerVerificationPanel
            recordId={`tracker_session_${slug}`}
            subjectLabel="Plenary session report"
            payload={payload}
            accentColor="#e8962a"
          />
        </div>
      )}
    </div>
  );
}
