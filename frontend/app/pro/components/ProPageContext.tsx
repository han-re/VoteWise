"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ProPageMeta {
  title: string;
  breadcrumb: string[];
}

export interface ProHealth {
  last_donations_seeded_at: string | null;
  last_spending_seeded_at: string | null;
  last_sessions_seeded_at: string | null;
}

interface Ctx {
  meta: ProPageMeta;
  setMeta: (m: ProPageMeta) => void;
  health: ProHealth | null;
}

const ProPageCtx = createContext<Ctx | null>(null);

export function ProPageProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<ProPageMeta>({
    title: "VoteWise Pro",
    breadcrumb: [],
  });
  const [health, setHealth] = useState<ProHealth | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/pro/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((h: ProHealth | null) => setHealth(h))
      .catch(() => {});
  }, []);

  const value = useMemo(() => ({ meta, setMeta, health }), [meta, health]);
  return <ProPageCtx.Provider value={value}>{children}</ProPageCtx.Provider>;
}

export function useProPage() {
  const ctx = useContext(ProPageCtx);
  if (!ctx) {
    throw new Error("useProPage must be used inside ProPageProvider (under /pro)");
  }
  return ctx;
}

export function useSetProPage(title: string, breadcrumb: string[] = []) {
  const { setMeta } = useProPage();
  const breadcrumbKey = breadcrumb.join("|");
  const pageMeta = useMemo(
    () => ({ title, breadcrumb: breadcrumbKey ? breadcrumbKey.split("|") : [] }),
    [title, breadcrumbKey]
  );
  useEffect(() => {
    setMeta(pageMeta);
  }, [pageMeta, setMeta]);
}
