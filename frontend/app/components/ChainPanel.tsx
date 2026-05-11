"use client";
import { useEffect, useState, useCallback } from "react";

interface ChangelogEntry {
  tx_signature: string;
  profile_hash: string;
  explorer_url: string;
  verified_at: string;
  replaced_at: string;
}

interface ChainState {
  politician_id: string;
  tx_signature: string;
  profile_hash: string;
  explorer_url: string;
  verified_at: string;
  network: string;
  fallback: boolean;
  changelog?: ChangelogEntry[];
}

type VerifyStatus = "idle" | "checking" | "match" | "mismatch" | "error";

interface Props {
  politicianId: string;
}

// Recursively sort all object keys — must match Python's json.dumps(sort_keys=True)
function sortKeysDeep(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeysDeep);
  if (val !== null && typeof val === "object") {
    return Object.keys(val as object)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = sortKeysDeep((val as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return val;
}

// SHA-256 using the browser's built-in Web Crypto API — no libraries needed
async function sha256(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashProfile(data: object): Promise<string> {
  // JSON.stringify with no spaces matches Python's separators=(',',':').
  // Python's json.dumps escapes non-ASCII as \uXXXX (ensure_ascii=True default).
  // We must do the same so the hash matches what was stamped on-chain.
  const raw = JSON.stringify(sortKeysDeep(data));
  const escaped = raw.replace(/[-￿]/g, (c) =>
    "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
  );
  return sha256(escaped);
}

function HashPill({ hash }: { hash: string }) {
  return (
    <span className="font-mono text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 break-all">
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
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      {label}
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function VerifyResult({ status, liveHash, storedHash }: {
  status: VerifyStatus;
  liveHash: string;
  storedHash: string;
}) {
  if (status === "checking") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 flex items-center gap-2">
        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Fetching profile and computing hash...
      </div>
    );
  }

  if (status === "match") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold text-emerald-800">Data matches blockchain record</span>
        </div>
        <p className="text-xs text-emerald-700">
          The profile data shown on this page is byte-for-byte identical to what was stamped on-chain.
          Nothing has been altered.
        </p>
        <div className="pt-1">
          <p className="text-xs font-medium text-emerald-700 mb-1">Computed fingerprint</p>
          <HashPill hash={liveHash} />
        </div>
      </div>
    );
  }

  if (status === "mismatch") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm font-semibold text-red-800">Data does not match blockchain record</span>
        </div>
        <p className="text-xs text-red-700">
          The current profile data produces a different fingerprint to what was stamped on-chain.
          The profile has been updated since it was last verified.
        </p>
        <div className="pt-1 space-y-2">
          <div>
            <p className="text-xs font-medium text-red-700 mb-1">Current fingerprint (live data)</p>
            <HashPill hash={liveHash} />
          </div>
          <div>
            <p className="text-xs font-medium text-red-700 mb-1">Stored fingerprint (on-chain)</p>
            <HashPill hash={storedHash} />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Could not fetch profile data to verify. Check your connection.
      </div>
    );
  }

  return null;
}

export default function ChainPanel({ politicianId }: Props) {
  const [state, setState] = useState<ChainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [liveHash, setLiveHash] = useState("");

  const api = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    fetch(`${api}/politician/${politicianId}/chain`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setState(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [politicianId, api]);

  const handleVerify = useCallback(async () => {
    if (!state) return;
    setVerifyStatus("checking");
    setLiveHash("");

    try {
      const r = await fetch(`${api}/politician/${politicianId}`);
      if (!r.ok) throw new Error();
      const profileData = await r.json();

      const computed = await hashProfile(profileData);
      setLiveHash(computed);
      setVerifyStatus(computed === state.profile_hash ? "match" : "mismatch");
    } catch {
      setVerifyStatus("error");
    }
  }, [state, politicianId, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        Checking blockchain...
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
        No blockchain record found for this politician yet.
      </div>
    );
  }

  const changelog = state.changelog ?? [];
  const blockchainLog = [
    {
      label: "Current",
      profile_hash: state.profile_hash,
      explorer_url: state.explorer_url,
      verified_at: state.verified_at,
      replaced_at: "",
    },
    ...[...changelog].reverse().map((entry, index) => ({
      label: `Previous ${index + 1}`,
      profile_hash: entry.profile_hash,
      explorer_url: entry.explorer_url,
      verified_at: entry.verified_at,
      replaced_at: entry.replaced_at,
    })),
  ];

  return (
    <div className="space-y-6">

      {/* Current verification status */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-emerald-800">
                {state.fallback ? "Verified (demo mode)" : "Blockchain Verified"}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Stamped {fmt(state.verified_at)} · Solana {state.network}
            </p>
          </div>
          <ExternalLink href={state.explorer_url} label="View on Solana Explorer" />
        </div>

        <div className="mt-4 space-y-2">
          <div>
            <p className="text-xs font-medium text-emerald-700 mb-1">Profile fingerprint</p>
            <HashPill hash={state.profile_hash} />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-700 mb-1">Transaction</p>
            <HashPill hash={state.tx_signature} />
          </div>
        </div>
      </div>

      {/* Verify Now */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Verify data integrity</h3>
          <p className="text-xs text-gray-500 mt-1">
            Fetches the live profile, computes a fingerprint in your browser, and compares
            it to what is stamped on the blockchain. No trust required.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifyStatus === "checking"}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {verifyStatus === "checking" ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Verifying...
            </>
          ) : "Verify Now"}
        </button>

        <VerifyResult
          status={verifyStatus}
          liveHash={liveHash}
          storedHash={state.profile_hash}
        />
      </div>

      {/* Blockchain log */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">
              Blockchain log
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Current and previous profile fingerprints stamped by the publication pipeline.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-white/60 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {blockchainLog.length} {blockchainLog.length === 1 ? "hash" : "hashes"}
          </span>
        </div>

        <div className="tracker-hidden-scrollbar max-h-56 space-y-4 overflow-y-auto pr-1">
          {blockchainLog.map((entry) => {
            const isCurrent = entry.label === "Current";
            return (
              <div
                key={`${entry.label}-${entry.profile_hash}`}
                className={`border-l-2 pl-4 ${isCurrent ? "border-emerald-300" : "border-amber-300"}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className={`text-xs ${isCurrent ? "text-emerald-700" : "text-amber-700"}`}>
                    {entry.label} - stamped {fmt(entry.verified_at)}
                    {entry.replaced_at ? ` - replaced ${fmt(entry.replaced_at)}` : ""}
                  </p>
                  <ExternalLink href={entry.explorer_url} label={isCurrent ? "View current" : "View version"} />
                </div>
                <div className="mt-1">
                  <HashPill hash={entry.profile_hash} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
