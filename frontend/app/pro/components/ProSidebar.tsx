"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

interface NavItem {
  label: string;
  href: string;
}

const NAV: NavItem[] = [
  { label: "Overview",                  href: "/pro" },
  { label: "Donations & Spending",      href: "/pro/donations" },
  { label: "Attendance & Engagement",   href: "/pro/attendance" },
  { label: "Stormont Sessions",         href: "/pro/sessions" },
  { label: "MLA Profile +",             href: "/pro/mla-profile-plus" },
  { label: "Pricing",                   href: "/pro/pricing" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function ProSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() ?? "";
  const [orgName, setOrgName] = useState("Demo organisation");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem("votewise_pro_demo_org");
      if (stored) setOrgName(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function isActive(href: string): boolean {
    if (href === "/pro") return pathname === "/pro";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const containerStyle: CSSProperties = {
    width: collapsed ? 56 : 240,
    flexShrink: 0,
    background: "var(--vw-pro-surface)",
    borderRight: "1px solid var(--vw-pro-grid)",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.18s ease",
    position: "sticky",
    top: 0,
    height: "100vh",
  };

  const brandStyle: CSSProperties = {
    padding: "20px 18px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: "1px solid var(--vw-pro-grid)",
  };

  const proPillStyle: CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "2px 7px",
    borderRadius: 4,
    background: "var(--vw-pro-cyan-dim)",
    color: "var(--vw-pro-cyan)",
    fontFamily: "var(--vw-pro-mono)",
  };

  return (
    <aside style={containerStyle} aria-label="VoteWise Pro navigation">
      {/* Brand */}
      <div style={brandStyle}>
        <Link
          href="/pro"
          className="pro-no-hover"
          style={{
            color: "#cddcec",
            textDecoration: "none",
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {!collapsed && (
            <span>
              Vote<span style={{ color: "var(--vw-pro-cyan)" }}>Wise</span>
            </span>
          )}
          {!collapsed && <span style={proPillStyle}>PRO</span>}
          {collapsed && <span style={proPillStyle}>PRO</span>}
        </Link>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "transparent",
            border: "1px solid var(--vw-pro-grid)",
            color: "rgba(180,207,232,0.6)",
            width: 24,
            height: 24,
            borderRadius: 4,
            cursor: "pointer",
            display: collapsed ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          ‹
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "block",
                padding: collapsed ? "10px 0" : "10px 18px",
                margin: "1px 0",
                color: active ? "#cddcec" : "rgba(205,220,236,0.66)",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                background: active ? "var(--vw-pro-cyan-dim)" : "transparent",
                borderLeft: active
                  ? "2px solid var(--vw-pro-cyan)"
                  : "2px solid transparent",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: collapsed ? "center" : "left",
              }}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </Link>
          );
        })}
      </nav>

      {/* Demo org footer */}
      {!collapsed && (
        <div
          style={{
            padding: "12px 18px 16px",
            borderTop: "1px solid var(--vw-pro-grid)",
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          <div style={{ color: "rgba(180,207,232,0.45)", marginBottom: 2, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 10 }}>
            Signed in as
          </div>
          <div style={{ color: "#cddcec", fontWeight: 500 }}>{orgName}</div>
        </div>
      )}
    </aside>
  );
}
