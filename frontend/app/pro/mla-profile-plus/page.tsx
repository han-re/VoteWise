import Link from "next/link";
import type { CSSProperties } from "react";

import { getTrackerMlas } from "../../tracker/_data";
import type { TrackerMla } from "../../tracker/_types";
import { ProPageTitleSetter } from "./ProPageTitleSetter";

const PARTY_FLAG: Record<string, string> = {
  "sinn-fein": "/images/1.png",
  dup: "/images/2.png",
  alliance: "/images/3.png",
  sdlp: "/images/4.png",
  uup: "/images/5.png",
  tuv: "/images/6.png",
  pbp: "/images/7.png",
};

const pageShell: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

function MlaFlagCard({ mla }: { mla: TrackerMla }) {
  const flag = PARTY_FLAG[mla.party] ?? "";

  return (
    <Link
      href={`/pro/mla-profile-plus/${mla.slug}`}
      style={{
        minHeight: 168,
        border: `1px solid ${mla.party_color}55`,
        borderRadius: 8,
        background: mla.party_color,
        color: "#f8fbff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        padding: 18,
        position: "relative",
        textDecoration: "none",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 36px rgba(0,0,0,0.35)",
      }}
      className="mandate-question-enter"
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5,10,20,0.28)",
        }}
        aria-hidden="true"
      />
      <span
        style={{
          alignSelf: "flex-start",
          background: "rgba(5,10,20,0.66)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 4,
          color: "#e6eef7",
          fontFamily: "var(--vw-pro-mono)",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.06em",
          marginBottom: 38,
          padding: "3px 7px",
          textTransform: "uppercase",
          position: "relative",
          zIndex: 1,
        }}
      >
        {mla.party_short_name}
      </span>
      <span
        style={{
          position: "absolute",
          right: 22,
          top: "50%",
          width: "min(34%, 220px)",
          height: "74%",
          transform: "translateY(-50%)",
          backgroundImage: `url(${flag})`,
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          opacity: 1,
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      <div style={{ position: "relative", zIndex: 2, paddingRight: "min(38%, 250px)" }}>
        <h2
          style={{
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1.05,
            margin: "0 0 6px",
            textShadow: "0 2px 18px rgba(0,0,0,0.9)",
          }}
        >
          {mla.name}
        </h2>
        <p style={{ color: "rgba(248,251,255,0.78)", fontSize: 12.5, lineHeight: 1.35, margin: 0 }}>
          {mla.role ? `${mla.role} · ` : ""}{mla.constituency}
        </p>
      </div>
    </Link>
  );
}

export default function MlaProfilePlusPage() {
  const { mlas } = getTrackerMlas();

  return (
    <div style={pageShell}>
      <ProPageTitleSetter title="MLA Profile +" breadcrumb={["MLA Profile +"]} />
      <header>
        <h2 style={{ margin: 0, fontSize: 20.6 }}>Featured profiles</h2>
        <p style={{ margin: "4px 0 0", color: "rgba(205,220,236,0.6)", fontSize: 13 }}>
          In-depth profile analysis based on voting records, pledges, interests, and verification history.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 14,
        }}
        aria-label="MLA profile links"
      >
        {mlas.map((mla) => (
          <MlaFlagCard key={mla.slug} mla={mla} />
        ))}
      </section>
    </div>
  );
}
