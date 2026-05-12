"use client";

import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import ChartWrapper from "./ChartWrapper";
import type { SwarmNode } from "../../tracker/_types";

interface WorkingNode extends SwarmNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
}

interface TooltipState {
  node: SwarmNode;
  x: number;
  y: number;
}

// ── Force simulation (no external dependency) ────────────────────────────────

const NODE_R = 13;
const PAD = 3;

function simulate(
  nodes: WorkingNode[],
  _chartW: number,
  chartH: number,
  scoreLeft: number,
  scoreRight: number
): WorkingNode[] {
  const centerY = chartH / 2;

  for (let tick = 0; tick < 320; tick++) {
    const alpha = Math.max(0, 1 - tick / 200);

    for (const n of nodes) {
      // x-spring: pull toward score-based position
      n.vx += (n.targetX - n.x) * 0.14 * alpha + (n.targetX - n.x) * 0.03;
      // y-spring: pull toward centre
      n.vy += (centerY - n.y) * 0.09 * (alpha + 0.01);
      // damping
      n.vx *= 0.78;
      n.vy *= 0.78;
    }

    // Collision resolution
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i];
        const nj = nodes[j];
        const dx = nj.x - ni.x;
        const dy = nj.y - ni.y;
        const dist2 = dx * dx + dy * dy;
        const minD = (NODE_R + PAD) * 2;
        if (dist2 < minD * minD && dist2 > 0.001) {
          const dist = Math.sqrt(dist2);
          const overlap = (minD - dist) / dist * 0.55;
          ni.vx -= dx * overlap;
          ni.vy -= dy * overlap;
          nj.vx += dx * overlap;
          nj.vy += dy * overlap;
        }
      }
    }

    // Integrate
    for (const n of nodes) {
      n.x = Math.max(scoreLeft - 10, Math.min(scoreRight + 10, n.x + n.vx));
      n.y = Math.max(NODE_R + PAD + 2, Math.min(chartH - NODE_R - PAD - 2, n.y + n.vy));
    }
  }

  return nodes;
}

// ── Shape renderer ────────────────────────────────────────────────────────────

function NodeShape({
  shape,
  r,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
}: {
  shape: SwarmNode["party_shape"];
  r: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
}) {
  switch (shape) {
    case "circle":
      return (
        <circle r={r} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
    case "square": {
      const s = r * 1.65;
      return (
        <rect
          x={-s / 2} y={-s / 2} width={s} height={s}
          fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth}
        />
      );
    }
    case "diamond": {
      const pts = `0,${-r} ${r},0 0,${r} ${-r},0`;
      return (
        <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
    }
    case "triangle": {
      const pts = `0,${-r} ${r * 0.9},${r * 0.55} ${-r * 0.9},${r * 0.55}`;
      return (
        <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
    }
    case "hexagon": {
      const angles = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180);
      const pts = angles.map((a) => `${r * Math.cos(a)},${r * Math.sin(a)}`).join(" ");
      return (
        <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
    }
    case "pentagon": {
      const angles = [0, 72, 144, 216, 288].map((a) => ((a - 90) * Math.PI) / 180);
      const pts = angles.map((a) => `${r * Math.cos(a)},${r * Math.sin(a)}`).join(" ");
      return (
        <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
    }
    default:
      return (
        <circle r={r} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} />
      );
  }
}

// ── Legend item ───────────────────────────────────────────────────────────────

function LegendItem({ shape, color, label }: { shape: SwarmNode["party_shape"]; color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
      <svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true">
        <NodeShape shape={shape} r={7} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={0} />
      </svg>
      <span style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.5)" }}>{label}</span>
    </div>
  );
}

// ── Axis tick ─────────────────────────────────────────────────────────────────

const TICKS = [0, 25, 50, 75, 100];

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  nodes: SwarmNode[];
}

const CHART_H = 260;
const AXIS_H = 32;
const LEFT_PAD = 20;
const RIGHT_PAD = 20;
const TOTAL_H = CHART_H + AXIS_H;

function stableJitter(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash / 0xffffffff - 0.5) * 30;
}

export default function BeeSwarm({ nodes }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scoreLeft = LEFT_PAD + 40;
  const scoreRight = width - RIGHT_PAD - 40;

  const scoreToX = useCallback(
    (score: number) => scoreLeft + (score / 100) * (scoreRight - scoreLeft),
    [scoreLeft, scoreRight]
  );

  // Measure container width
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const positions = useMemo(() => {
    if (width < 100 || nodes.length === 0) return [];

    const working: WorkingNode[] = nodes.map((n) => ({
      ...n,
      targetX: scoreToX(n.score),
      x: scoreToX(n.score),
      y: CHART_H / 2 + stableJitter(n.id),
      vx: 0,
      vy: 0,
    }));

    return simulate(working, width, CHART_H, scoreLeft, scoreRight);
  }, [width, nodes, scoreToX, scoreLeft, scoreRight]);

  // Staggered reveal after the latest simulation is available.
  useEffect(() => {
    if (positions.length === 0) return;
    // Staggered reveal
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, [positions]);

  // CSV data
  const csvHeaders = ["Name", "Party", "Constituency", "Delivery Score"];
  const csvRows = nodes.map((n) => [n.name, n.party_name, n.constituency, n.score]);

  // Table data
  const tableData = {
    headers: csvHeaders,
    rows: csvRows,
  };

  const uniqueParties = Array.from(
    new Map(nodes.map((n) => [n.party_id, n])).values()
  ).sort((a, b) => a.party_name.localeCompare(b.party_name));

  return (
    <ChartWrapper
      title="Pledge Delivery Scores"
      subtitle="Each dot is an MLA. Position shows how well their party's 2022 manifesto pledges are being delivered. Hover for detail, click to view profile."
      caveat="Scores are weighted averages of pledge status (backed=100, partial=50, mismatch=0). Excludes pledges blocked by Westminster legislation beyond devolved control."
      csvFilename="mla-tracker-delivery-scores"
      csvHeaders={csvHeaders}
      csvRows={csvRows}
      tableData={tableData}
      accentColor="#e8962a"
    >
      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.9rem",
          paddingBottom: "1rem",
        }}
        role="list"
        aria-label="Party legend"
      >
        {uniqueParties.map((n) => (
          <div key={n.party_id} role="listitem">
            <LegendItem shape={n.party_shape} color={n.party_color} label={n.party_name} />
          </div>
        ))}
      </div>

      {/* SVG bee swarm */}
      <div ref={containerRef} style={{ position: "relative" }}>
        <svg
          width="100%"
          height={TOTAL_H}
          viewBox={`0 0 ${width} ${TOTAL_H}`}
          aria-labelledby="beeswarm-title beeswarm-desc"
          role="img"
          style={{ display: "block", overflow: "visible" }}
        >
          <title id="beeswarm-title">MLA Pledge Delivery Scores</title>
          <desc id="beeswarm-desc">
            Scatter plot showing {nodes.length} MLAs positioned by their pledge delivery score from 0 (no pledges delivered) to 100 (all pledges delivered). Each shape represents a different party.
          </desc>

          {/* Grid lines */}
          {TICKS.map((t) => {
            const x = scoreToX(t);
            return (
              <line
                key={t}
                x1={x} y1={0} x2={x} y2={CHART_H}
                stroke="rgba(180,207,232,0.06)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Score zone shading: low (red tint) → high (green tint) */}
          <defs>
            <linearGradient id="zone-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.04" />
              <stop offset="50%" stopColor="#e8962a" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect
            x={scoreLeft} y={4} width={scoreRight - scoreLeft} height={CHART_H - 8}
            fill="url(#zone-gradient)"
            rx={4}
          />

          {/* MLA nodes */}
          {positions.map((n, i) => {
            const isHovered = hoveredId === n.id;
            const opacity = hoveredId && !isHovered ? 0.28 : 1;
            return (
              // Outer g: only handles position — never touched by CSS animation
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                {/* Inner g: handles opacity fade-in and hover scale via CSS */}
                <g
                  style={{
                    cursor: "pointer",
                    opacity: ready ? opacity : 0,
                    transform: isHovered ? "scale(1.35)" : "scale(1)",
                    transformOrigin: "0 0",
                    transformBox: "fill-box",
                    transition: `opacity 0.25s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)`,
                    animation: ready
                      ? `swarmFadeIn 0.35s ${i * 0.06}s cubic-bezier(0.16,1,0.3,1) both`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    setHoveredId(n.id);
                    const svgEl = e.currentTarget.closest("svg");
                    const svgRect = svgEl?.getBoundingClientRect();
                    if (!svgRect) return;
                    setTooltip({
                      node: n,
                      x: n.x * (svgRect.width / width),
                      y: n.y * (svgRect.height / TOTAL_H),
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    setTooltip(null);
                  }}
                  onClick={() => router.push(`/tracker/mla/${n.id}`)}
                  role="button"
                  aria-label={`${n.name}, ${n.party_name}, delivery score ${n.score}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/tracker/mla/${n.id}`);
                    }
                  }}
                >
                  {isHovered && (
                    <circle
                      r={NODE_R + 7}
                      fill="none"
                      stroke={n.party_color}
                      strokeWidth={1.5}
                      strokeOpacity={0.35}
                    />
                  )}
                  <NodeShape
                    shape={n.party_shape}
                    r={NODE_R}
                    fill={n.party_color}
                    fillOpacity={isHovered ? 1 : 0.82}
                    stroke={isHovered ? "#ffffff" : n.party_color}
                    strokeWidth={isHovered ? 2 : 0}
                  />
                </g>
              </g>
            );
          })}

          {/* X axis */}
          <g transform={`translate(0,${CHART_H})`}>
            <line
              x1={scoreLeft - 4} y1={0} x2={scoreRight + 4} y2={0}
              stroke="rgba(180,207,232,0.15)"
              strokeWidth={1}
            />
            {TICKS.map((t) => {
              const x = scoreToX(t);
              return (
                <g key={t} transform={`translate(${x},0)`}>
                  <line y1={0} y2={5} stroke="rgba(180,207,232,0.18)" strokeWidth={1} />
                  <text
                    y={18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(180,207,232,0.35)"
                    fontFamily="'Segoe UI', system-ui, sans-serif"
                  >
                    {t}
                  </text>
                </g>
              );
            })}
            <text
              x={scoreLeft + (scoreRight - scoreLeft) / 2}
              y={AXIS_H - 4}
              textAnchor="middle"
              fontSize="9.5"
              fill="rgba(180,207,232,0.22)"
              fontFamily="'Segoe UI', system-ui, sans-serif"
              letterSpacing="0.08em"
              textRendering="optimizeLegibility"
              style={{ textTransform: "uppercase" } as CSSProperties}
            >
              PLEDGE DELIVERY SCORE
            </text>
          </g>

          {/* Inline CSS for fade-in animation */}
          <style>{`
            @keyframes swarmFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </svg>

        {/* Tooltip (HTML, positioned over SVG) */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x + 18,
              top: tooltip.y - 10,
              background: "rgba(8,14,26,0.96)",
              border: `1px solid ${tooltip.node.party_color}55`,
              borderLeft: `3px solid ${tooltip.node.party_color}`,
              borderRadius: "10px",
              padding: "0.65rem 0.9rem",
              pointerEvents: "none",
              zIndex: 20,
              maxWidth: "200px",
              backdropFilter: "blur(12px)",
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${tooltip.node.party_color}22`,
            }}
            role="tooltip"
          >
            <p
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#b4cfe8",
                margin: "0 0 0.15rem",
                lineHeight: 1.2,
              }}
            >
              {tooltip.node.name}
            </p>
            {tooltip.node.role && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: tooltip.node.party_color,
                  margin: "0 0 0.3rem",
                  fontWeight: 600,
                }}
              >
                {tooltip.node.role}
              </p>
            )}
            <p
              style={{
                fontSize: "0.67rem",
                color: "rgba(180,207,232,0.45)",
                margin: "0 0 0.5rem",
              }}
            >
              {tooltip.node.party_name} · {tooltip.node.constituency}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.35rem",
              }}
            >
              <span
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: tooltip.node.party_color,
                  lineHeight: 1,
                }}
              >
                {tooltip.node.score}
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(180,207,232,0.3)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                / 100
              </span>
            </div>
            <p
              style={{
                fontSize: "0.6rem",
                color: "rgba(180,207,232,0.25)",
                margin: "0.2rem 0 0",
              }}
            >
              Click to view profile →
            </p>
          </div>
        )}
      </div>
    </ChartWrapper>
  );
}
