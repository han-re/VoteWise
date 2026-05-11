import Link from "next/link";
import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { ChatbotProvider } from "../components/tracker/ChatbotProvider";
import { FloatingChatbot } from "../components/tracker/FloatingChatbot";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MLA Tracker — VoteWise",
  description:
    "Track how Northern Ireland MLAs vote and speak versus what they promised — evidence-led accountability journalism.",
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatbotProvider>
      <div
        className={sourceSerif.variable}
        style={{
          background: "#080e1a",
          color: "#cddcec",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          minHeight: "100vh",
        }}
      >
        {/* Stormont background */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/storm.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.06,
          }}
        />
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(8,14,26,0.9) 100%)",
          }}
        />

        {/* Sticky nav */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(8,14,26,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(180,207,232,0.07)",
            padding: "0.7rem 2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
          aria-label="MLA Tracker navigation"
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "rgba(180,207,232,0.4)",
              fontSize: "0.72rem",
              textDecoration: "none",
            }}
            className="tracker-nav-link"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            VoteWise
          </Link>

          <span
            style={{ color: "rgba(180,207,232,0.18)", fontSize: "0.72rem" }}
            aria-hidden="true"
          >
            /
          </span>

          <Link
            href="/tracker"
            style={{
              color: "#e8962a",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            MLA Tracker
          </Link>

          {/* Right-side nav */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "1.2rem",
              alignItems: "center",
            }}
          >
            <Link
              href="/tracker/reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.7rem",
                textDecoration: "none",
                color: "#e8962a",
                fontWeight: 600,
                padding: "0.22rem 0.55rem",
                borderRadius: "6px",
                background: "rgba(232,150,42,0.08)",
                border: "1px solid rgba(232,150,42,0.2)",
              }}
              aria-label="Analysis reports"
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Analysis
            </Link>
            <Link
              href="/tracker/methodology"
              style={{
                color: "rgba(180,207,232,0.36)",
                fontSize: "0.7rem",
                textDecoration: "none",
              }}
              className="tracker-nav-link"
            >
              Methodology
            </Link>
          </div>
        </nav>

        {/* Page content */}
        <div className="relative z-10">{children}</div>

        {/* Floating chatbot sidebar — client component */}
        <FloatingChatbot />

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            borderTop: "1px solid rgba(180,207,232,0.05)",
            marginTop: "4rem",
          }}
        >
          <p
            style={{
              fontSize: "0.62rem",
              color: "rgba(180,207,232,0.14)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            MLA Tracker &nbsp;·&nbsp; Public data, transparent methodology
          </p>
          <p style={{ fontSize: "0.6rem", color: "rgba(180,207,232,0.1)" }}>
            All data sourced from Stormont&apos;s Official Report (Hansard), the Register of
            Members&apos; Interests, and the Electoral Commission.{" "}
            <Link
              href="/tracker/methodology"
              style={{ color: "rgba(180,207,232,0.22)", textDecoration: "underline" }}
            >
              How we calculate scores
            </Link>
          </p>
        </footer>
      </div>
    </ChatbotProvider>
  );
}
