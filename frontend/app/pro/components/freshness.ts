import type { ProHealth } from "./ProPageContext";

/** Most recent of the three seed-marker timestamps, or null if all are missing. */
export function newestSeedStamp(health: ProHealth | null): string | null {
  if (!health) return null;
  const stamps = [
    health.last_donations_seeded_at,
    health.last_spending_seeded_at,
    health.last_sessions_seeded_at,
  ].filter((s): s is string => Boolean(s));
  if (stamps.length === 0) return null;
  return stamps.sort().reverse()[0];
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "never";
  const ageMs = Date.now() - ts;
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatAbsolute(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "never";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
