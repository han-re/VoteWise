"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ProSidebar } from "./ProSidebar";
import { ProTopBar } from "./ProTopBar";
import { ProDataQualityFooter } from "./ProDataQualityFooter";
import { ProPageProvider } from "./ProPageContext";

const NARROW_BREAKPOINT_PX = 900;

export function ProShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function syncToViewport() {
      setCollapsed(window.innerWidth < NARROW_BREAKPOINT_PX);
    }
    syncToViewport();
    window.addEventListener("resize", syncToViewport);
    return () => window.removeEventListener("resize", syncToViewport);
  }, []);

  return (
    <ProPageProvider>
      <div
        className="pro-shell"
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--vw-dark)",
          color: "#cddcec",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <ProSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <ProTopBar />
          <main style={{ flex: 1, padding: "28px 32px 48px" }}>{children}</main>
          <ProDataQualityFooter />
        </div>
      </div>
    </ProPageProvider>
  );
}
