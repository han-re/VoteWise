"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

interface ChangelogEntry {
  profile_hash: string;
  explorer_url: string;
  verified_at: string;
  replaced_at: string;
}

interface ChainState {
  politician_id: string;
  profile_hash: string;
  explorer_url: string;
  verified_at: string;
  network: string;
  fallback: boolean;
  changelog?: ChangelogEntry[];
}

type VerifyStatus = "idle" | "checking" | "match" | "mismatch" | "missing" | "error";

interface Props {
  recordId: string;
  subjectLabel: string;
  payload: unknown;
  accentColor?: string;
}

const TRACKER_CARD: CSSProperties = {
  background: "rgba(11,20,38,0.82)",
  border: "1px solid rgba(180,207,232,0.11)",
  borderRadius: "12px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 1px 0 rgba(180,207,232,0.07), 0 20px 60px rgba(0,0,0,0.45)",
  overflow: "hidden",
  position: "relative",
};
const GREEN_TEXT = "#bbf7d0";
const GREEN_MUTED = "rgba(187,247,208,0.76)";
const GREEN_DIM = "rgba(187,247,208,0.58)";
const EMERALD = "#22c55e";
const PANEL_FONT = "var(--font-geist-sans), 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPayload(payload: unknown): Promise<string> {
  const raw = JSON.stringify(sortKeysDeep(payload));
  const escaped = raw.replace(/[^\x00-\x7F]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(4, "0");
    return `\\u${code}`;
  });
  return sha256(escaped);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HashPill({ hash }: { hash: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        maxWidth: "100%",
        wordBreak: "break-all",
        fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Consolas, monospace)",
        fontSize: "0.95rem",
        lineHeight: 1.35,
        color: "#f8fafc",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.11)",
        borderRadius: "6px",
        padding: "0.12rem 0.5rem",
      }}
    >
      {hash}
    </span>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        color: "#86efac",
        fontSize: "1rem",
        textDecoration: "none",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

function VerifyResult({
  status,
  liveHash,
  storedHash,
}: {
  status: VerifyStatus;
  liveHash: string;
  storedHash?: string;
}) {
  if (status === "checking") {
    return (
      <div style={{ border: "1px solid rgba(34,197,94,0.18)", background: "rgba(34,197,94,0.07)", borderRadius: "8px", padding: "1rem", color: GREEN_TEXT, fontSize: "0.95rem" }}>
        Fetching the page data and computing a browser fingerprint...
      </div>
    );
  }

  if (status === "match") {
    return (
      <div style={{ border: "1px solid rgba(34,197,94,0.24)", background: "rgba(34,197,94,0.08)", borderRadius: "8px", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.65rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M5 13l4 4L19 7" />
          </svg>
          <h4 style={{ margin: 0, color: GREEN_TEXT, fontSize: "1rem", fontWeight: 700, letterSpacing: "0" }}>
            Data matches blockchain record
          </h4>
        </div>
        <p style={{ margin: "0 0 0.75rem", color: GREEN_MUTED, fontSize: "0.95rem", lineHeight: 1.55 }}>
          The tracker data shown on this page is byte-for-byte identical to what was stamped for this record.
          Nothing has been altered.
        </p>
        <p style={{ margin: "0.35rem 0 0.4rem", color: GREEN_MUTED, fontSize: "0.9rem", fontWeight: 700 }}>
          Computed fingerprint
        </p>
        <HashPill hash={liveHash} />
      </div>
    );
  }

  if (status === "mismatch") {
    return (
      <div style={{ border: "1px solid rgba(239,68,68,0.24)", background: "rgba(239,68,68,0.08)", borderRadius: "8px", padding: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem", color: GREEN_TEXT, fontSize: "1rem", fontWeight: 700 }}>
          Data does not match blockchain record
        </h4>
        <p style={{ margin: "0 0 0.75rem", color: GREEN_MUTED, fontSize: "0.95rem", lineHeight: 1.55 }}>
          The current tracker data produces a different fingerprint to the stored record.
          This page has changed since the latest publication stamp.
        </p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div>
            <p style={{ margin: "0 0 0.35rem", color: GREEN_MUTED, fontSize: "0.9rem", fontWeight: 700 }}>Current fingerprint</p>
            <HashPill hash={liveHash} />
          </div>
          {storedHash && (
            <div>
              <p style={{ margin: "0 0 0.35rem", color: GREEN_MUTED, fontSize: "0.9rem", fontWeight: 700 }}>Stored fingerprint</p>
              <HashPill hash={storedHash} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div style={{ border: "1px solid rgba(232,150,42,0.28)", background: "rgba(232,150,42,0.08)", borderRadius: "8px", padding: "1rem", color: GREEN_TEXT, fontSize: "0.95rem", lineHeight: 1.55 }}>
        No stored hash was found for this tracker record. Tracker hashes are created by the backend publication pipeline, not by page visitors.
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ border: "1px solid rgba(180,207,232,0.12)", background: "rgba(180,207,232,0.05)", borderRadius: "8px", padding: "1rem", color: GREEN_TEXT, fontSize: "0.95rem" }}>
        Could not verify this record. Check the backend connection and try again.
      </div>
    );
  }

  return null;
}

function DarkTopStripe({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        borderRadius: "14px 14px 0 0",
        opacity: 0.75,
      }}
    />
  );
}

export default function TrackerVerificationPanel({
  recordId,
  payload,
  accentColor = "#22c55e",
}: Props) {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "";
  const payloadKey = useMemo(() => JSON.stringify(payload), [payload]);
  const [state, setState] = useState<ChainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveHash, setLiveHash] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");

  useEffect(() => {
    let cancelled = false;
    fetch(`${api}/chain/status/${recordId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ChainState | null) => {
        if (cancelled) return;
        setState(data);
        setVerifyStatus(data ? "idle" : "missing");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setState(null);
        setVerifyStatus("missing");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, recordId]);

  useEffect(() => {
    let cancelled = false;
    hashPayload(payload)
      .then((hash) => {
        if (!cancelled) setLiveHash(hash);
      })
      .catch(() => {
        if (!cancelled) setVerifyStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [payloadKey, payload]);

  const handleVerify = useCallback(async () => {
    setVerifyStatus("checking");
    try {
      const computed = await hashPayload(payload);
      setLiveHash(computed);
      if (!state) {
        setVerifyStatus("missing");
        return;
      }
      setVerifyStatus(computed === state.profile_hash ? "match" : "mismatch");
    } catch {
      setVerifyStatus("error");
    }
  }, [payload, state]);

  const history = [
    ...(state
      ? [
          {
            label: "Current",
            profile_hash: state.profile_hash,
            explorer_url: state.explorer_url,
            verified_at: state.verified_at,
          },
        ]
      : []),
    ...[...(state?.changelog ?? [])].reverse().map((entry, index) => ({
      label: `Previous ${index + 1}`,
      profile_hash: entry.profile_hash,
      explorer_url: entry.explorer_url,
      verified_at: entry.verified_at,
    })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontFamily: PANEL_FONT, letterSpacing: 0 }}>
      <div
        style={{
          ...TRACKER_CARD,
          borderColor: "rgba(232,150,42,0.24)",
          padding: "1.5rem",
        }}
      >
        <DarkTopStripe color={GREEN_TEXT} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span
                aria-hidden="true"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              >
                {state && (
                  <span
                    className="animate-ping"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "#86efac",
                      opacity: 0.75,
                    }}
                  />
                )}
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: state ? EMERALD : "rgba(180,207,232,0.35)",
                    boxShadow: state ? "0 0 14px rgba(34,197,94,0.9)" : "none",
                  }}
                />
              </span>
              <h3 style={{ margin: 0, color: GREEN_TEXT, fontSize: "1.1rem", fontWeight: 700, letterSpacing: 0 }}>
                {state ? (state.fallback ? "Verified" : "Blockchain verified") : "Awaiting publication stamp"}
              </h3>
            </div>
            {state ? (
              <p style={{ margin: 0, color: GREEN_DIM, fontSize: "0.8rem", lineHeight: 1.45 }}>
                Stamped {formatDate(state.verified_at)} - Solana {state.network}
              </p>
            ) : (
              <p style={{ margin: 0, color: GREEN_DIM, fontSize: "0.8rem", lineHeight: 1.45 }}>
                No stored chain record has been published for this tracker page yet.
              </p>
            )}
          </div>

          <ExternalLink href={state?.explorer_url ?? "https://explorer.solana.com/?cluster=devnet"} label="View on Solana Explorer" />
        </div>

        <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
          <div>
            <p style={{ margin: "0 0 0.4rem", color: GREEN_MUTED, fontSize: "0.9rem", fontWeight: 700 }}>
              Profile fingerprint
            </p>
            {state ? <HashPill hash={state.profile_hash} /> : <HashPill hash={liveHash || "computing"} />}
          </div>
        </div>
      </div>

      <div
        style={{
          ...TRACKER_CARD,
          padding: "1.5rem",
        }}
      >
        <DarkTopStripe color="#b4cfe8" />
        <h3 style={{ margin: "0 0 0.35rem", color: GREEN_TEXT, fontSize: "1rem", fontWeight: 700 }}>
          Verify data integrity
        </h3>
        <p style={{ margin: "0 0 1rem", color: GREEN_DIM, fontSize: "0.92rem", lineHeight: 1.55 }}>
          Computes a fingerprint in your browser and compares it to the hash stamped by the backend publication pipeline.
        </p>
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifyStatus === "checking"}
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: "8px",
            color: GREEN_TEXT,
            cursor: verifyStatus === "checking" ? "default" : "pointer",
            fontSize: "0.95rem",
            fontWeight: 700,
            padding: "0.5rem 1rem",
            opacity: verifyStatus === "checking" ? 0.65 : 1,
            marginBottom: verifyStatus === "idle" ? 0 : "1rem",
          }}
        >
          {verifyStatus === "checking" ? "Verifying..." : "Verify Now"}
        </button>

        <VerifyResult status={verifyStatus} liveHash={liveHash} storedHash={state?.profile_hash} />
      </div>

      <div style={{ ...TRACKER_CARD, padding: "1.5rem" }}>
        <DarkTopStripe color={accentColor} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, color: GREEN_TEXT, fontSize: "1rem", fontWeight: 700 }}>
            Blockchain history
          </h3>
        </div>

        {loading ? (
          <p style={{ color: GREEN_DIM, fontSize: "0.92rem", margin: 0 }}>Loading chain history...</p>
        ) : history.length > 0 ? (
          <div
            className="tracker-hidden-scrollbar"
            style={{
              maxHeight: "14rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              paddingRight: "0.35rem",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {history.map((entry) => (
              <div key={`${entry.label}-${entry.profile_hash}`} style={{ borderLeft: `2px solid ${accentColor}`, paddingLeft: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                  <p style={{ margin: 0, color: GREEN_MUTED, fontSize: "0.9rem", fontWeight: 700 }}>
                    {entry.label} - {formatDate(entry.verified_at)}
                  </p>
                </div>
                <HashPill hash={entry.profile_hash} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: GREEN_DIM, fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>
            No stored hashes were found for this tracker record. Tracker records are stamped by the backend publication pipeline, not from the public page.
          </p>
        )}
      </div>
    </div>
  );
}
